import { ERC20_ABI } from '@revoke.cash/core/abis';
import { createViemPublicClientForChain } from '@revoke.cash/core/chains';
import { type DatabaseWriter, getDb, getTransactionalDb } from '@revoke.cash/core/db/client';
import { autoRevokeActions } from '@revoke.cash/core/db/schema/auto-revoke';
import { batchRevokes } from '@revoke.cash/core/db/schema/batch-revokes';
import {
  premiumPayments,
  premiumRefundRequests,
  premiumSubscriptionAddresses,
} from '@revoke.cash/core/db/schema/premium';
import { isUniqueViolationError } from '@revoke.cash/core/db/utils';
import { ExportableError } from '@revoke.cash/core/utils/errors';
import { DAY } from '@revoke.cash/core/utils/time';
import { and, count, eq, gte, inArray, isNull, sum } from 'drizzle-orm';
import { type Address, decodeEventLog, type Hash, isAddressEqual, TransactionReceiptNotFoundError } from 'viem';
import { REFUND_DEADLINE_DAYS, REFUND_WINDOW_DAYS, usdCentsToTokenUnits } from './payment-config';
import type { PremiumPaymentStatus } from './payments';
import { transitionPaymentAndRebuild } from './subscriptions';

export class PremiumRefundError extends ExportableError {
  constructor(
    message: string,
    public readonly status: number = 400,
  ) {
    super(message);
    this.name = 'PremiumRefundError';
  }

  export() {
    return { status: this.status, body: { message: this.message } };
  }
}

interface CreateRefundRequestParams {
  ownerAddress: Address;
  paymentId: string;
  reason?: string;
}

export const createRefundRequest = async ({
  ownerAddress,
  paymentId,
  reason,
}: CreateRefundRequestParams): Promise<{ id: string }> => {
  const db = getTransactionalDb();

  return db.transaction(async (trx) => {
    // Lock the payment row so the reverify sweep cannot reverse it mid-request and concurrent
    // duplicate requests serialize on the lock instead of racing the uniqueness check
    const [payment] = await trx
      .select({
        id: premiumPayments.id,
        status: premiumPayments.status,
        confirmedAt: premiumPayments.confirmedAt,
        amountUsdCents: premiumPayments.amountUsdCents,
        grantedBy: premiumPayments.grantedBy,
      })
      .from(premiumPayments)
      .where(and(eq(premiumPayments.id, paymentId), eq(premiumPayments.ownerAddress, ownerAddress)))
      .for('update');

    if (!payment) {
      throw new PremiumRefundError('Payment not found', 404);
    }

    if (payment.status !== 'confirmed' || !payment.confirmedAt) {
      throw new PremiumRefundError('Payment is not eligible for a refund');
    }

    if (payment.grantedBy) {
      throw new PremiumRefundError('Payment is not eligible for a refund');
    }

    if (payment.confirmedAt.getTime() + REFUND_WINDOW_DAYS * DAY <= Date.now()) {
      throw new PremiumRefundError('The refund window for this payment has closed');
    }

    const existingRequest = await trx.query.premiumRefundRequests.findFirst({
      where: and(eq(premiumRefundRequests.paymentId, paymentId), isNull(premiumRefundRequests.dismissedAt)),
      columns: { id: true },
    });

    if (existingRequest) {
      throw new PremiumRefundError('A refund has already been requested for this payment', 409);
    }

    // v1 refunds the payment in full; the column supports pro-rata or consumption deductions later
    const [request] = await trx
      .insert(premiumRefundRequests)
      .values({ paymentId, refundAmountUsdCents: payment.amountUsdCents, reason: reason || null })
      .returning({ id: premiumRefundRequests.id });

    return request;
  });
};

export interface PendingRefundRequest {
  id: string;
  requestedAt: string;
  refundDeadlineAt: string;
  refundTxHash: Hash | null;
  refundAmountUsdCents: number;
  reason: string | null;
  payment: {
    ownerAddress: Address;
    subscriptionId: string | null;
    chainId: number;
    tokenSymbol: string;
    tokenAddress: Address;
    tokenDecimals: number;
    amountUsdCents: number;
    status: PremiumPaymentStatus;
    confirmedAt: string | null;
  };
  // What the subscription consumed since this payment, so refund abuse is visible before processing
  consumption: {
    autoRevokeGasUsd: number;
    waivedBatchRevokeCount: number;
  };
}

export const getPendingRefundRequests = async (): Promise<PendingRefundRequest[]> => {
  const db = getDb();

  const requests = await db.query.premiumRefundRequests.findMany({
    where: and(isNull(premiumRefundRequests.processedAt), isNull(premiumRefundRequests.dismissedAt)),
    orderBy: (requests, { asc }) => [asc(requests.createdAt)],
    with: { payment: true },
  });

  return Promise.all(
    requests.map(async (request) => ({
      id: request.id,
      requestedAt: request.createdAt.toISOString(),
      refundDeadlineAt: new Date(request.createdAt.getTime() + REFUND_DEADLINE_DAYS * DAY).toISOString(),
      refundTxHash: request.refundTxHash,
      refundAmountUsdCents: request.refundAmountUsdCents,
      reason: request.reason,
      payment: {
        ownerAddress: request.payment.ownerAddress,
        subscriptionId: request.payment.subscriptionId,
        chainId: request.payment.chainId,
        tokenSymbol: request.payment.tokenSymbol,
        tokenAddress: request.payment.tokenAddress,
        tokenDecimals: request.payment.tokenDecimals,
        amountUsdCents: request.payment.amountUsdCents,
        status: request.payment.status,
        confirmedAt: request.payment.confirmedAt?.toISOString() ?? null,
      },
      consumption: await getPaymentConsumption(db, request.payment.subscriptionId, request.payment.confirmedAt),
    })),
  );
};

export interface RefundConfirmationData {
  requestedAt: Date;
  refundAmountUsdCents: number;
  processedAt: Date | null;
  refundTxHash: Hash | null;
  planName: string;
  paymentTxHash: Hash | null;
  chainId: number;
  ownerAddress: Address;
}

// Everything the durable-medium confirmation document needs, gated on payment ownership
export const getRefundConfirmationData = async (
  paymentId: string,
  ownerAddress: Address,
): Promise<RefundConfirmationData | null> => {
  const db = getDb();

  const request = await db.query.premiumRefundRequests.findFirst({
    where: and(eq(premiumRefundRequests.paymentId, paymentId), isNull(premiumRefundRequests.dismissedAt)),
    with: { payment: { with: { plan: { columns: { name: true } } } } },
  });

  if (!request || !isAddressEqual(request.payment.ownerAddress, ownerAddress)) return null;

  return {
    requestedAt: request.createdAt,
    refundAmountUsdCents: request.refundAmountUsdCents,
    processedAt: request.processedAt,
    refundTxHash: request.refundTxHash,
    planName: request.payment.plan.name,
    paymentTxHash: request.payment.matchedTxHash,
    chainId: request.payment.chainId,
    ownerAddress: request.payment.ownerAddress,
  };
};

export const getPendingRefundRequestCount = async (): Promise<number> => {
  const db = getDb();

  const [{ count: pendingCount }] = await db
    .select({ count: count() })
    .from(premiumRefundRequests)
    .where(and(isNull(premiumRefundRequests.processedAt), isNull(premiumRefundRequests.dismissedAt)));

  return pendingCount;
};

const getPaymentConsumption = async (
  db: DatabaseWriter,
  subscriptionId: string | null,
  confirmedAt: Date | null,
): Promise<PendingRefundRequest['consumption']> => {
  if (!subscriptionId || !confirmedAt) {
    return { autoRevokeGasUsd: 0, waivedBatchRevokeCount: 0 };
  }

  const [gasSpent] = await db
    .select({ total: sum(autoRevokeActions.costUsd) })
    .from(autoRevokeActions)
    .where(
      and(eq(autoRevokeActions.billedSubscriptionId, subscriptionId), gte(autoRevokeActions.createdAt, confirmedAt)),
    );

  const subscriptionAddresses = await db
    .select({ address: premiumSubscriptionAddresses.address })
    .from(premiumSubscriptionAddresses)
    .where(eq(premiumSubscriptionAddresses.subscriptionId, subscriptionId));

  const addresses = subscriptionAddresses.map((entry) => entry.address);

  const [waivedBatchRevokes] =
    addresses.length > 0
      ? await db
          .select({ count: count() })
          .from(batchRevokes)
          .where(
            and(
              inArray(batchRevokes.userAddress, addresses),
              gte(batchRevokes.timestamp, confirmedAt),
              eq(batchRevokes.feeUsdCents, 0),
            ),
          )
      : [{ count: 0 }];

  return {
    autoRevokeGasUsd: Number(gasSpent.total ?? 0),
    waivedBatchRevokeCount: waivedBatchRevokes.count,
  };
};

export const dismissRefundRequest = async (
  requestId: string,
): Promise<{ success: true; ownerAddress: Address; subscriptionId: string | null }> => {
  const db = getDb();

  const request = await db.query.premiumRefundRequests.findFirst({
    where: eq(premiumRefundRequests.id, requestId),
    with: { payment: { columns: { ownerAddress: true, subscriptionId: true } } },
  });

  if (!request) {
    throw new PremiumRefundError('Refund request is not pending');
  }

  const [dismissed] = await db
    .update(premiumRefundRequests)
    .set({ dismissedAt: new Date() })
    .where(
      and(
        eq(premiumRefundRequests.id, requestId),
        isNull(premiumRefundRequests.processedAt),
        isNull(premiumRefundRequests.dismissedAt),
      ),
    )
    .returning({ id: premiumRefundRequests.id });

  if (!dismissed) {
    throw new PremiumRefundError('Refund request is not pending');
  }

  return { success: true, ownerAddress: request.payment.ownerAddress, subscriptionId: request.payment.subscriptionId };
};

export type ProcessRefundOutcome = 'processed' | 'already_processed';

export const processRefundRequest = async (
  requestId: string,
  refundTxHash: Hash,
): Promise<{ outcome: ProcessRefundOutcome; ownerAddress: Address; subscriptionId: string | null }> => {
  const db = getTransactionalDb();

  // Loaded without locks: the on-chain verification below is an RPC call and must not hold any
  const request = await getDb().query.premiumRefundRequests.findFirst({
    where: eq(premiumRefundRequests.id, requestId),
    with: { payment: true },
  });

  if (!request) throw new PremiumRefundError('Refund request not found', 404);

  const { ownerAddress, subscriptionId } = request.payment;

  if (request.processedAt) {
    if (request.refundTxHash === refundTxHash) return { outcome: 'already_processed', ownerAddress, subscriptionId };
    throw new PremiumRefundError('Refund request was already processed with a different transaction', 409);
  }

  await verifyRefundTransfer(request.payment, refundTxHash, request.refundAmountUsdCents);

  const outcome = await runMappingUniqueViolations(() =>
    db.transaction(async (trx) => {
      const [lockedRequest] = await trx
        .select({
          processedAt: premiumRefundRequests.processedAt,
          dismissedAt: premiumRefundRequests.dismissedAt,
          refundTxHash: premiumRefundRequests.refundTxHash,
        })
        .from(premiumRefundRequests)
        .where(eq(premiumRefundRequests.id, requestId))
        .for('update');

      if (!lockedRequest) throw new PremiumRefundError('Refund request not found', 404);
      if (lockedRequest.dismissedAt) return 'request_dismissed' as const;
      if (lockedRequest.processedAt) {
        if (lockedRequest.refundTxHash === refundTxHash) return 'already_processed' as const;
        throw new PremiumRefundError('Refund request was already processed with a different transaction', 409);
      }

      const transitioned = await transitionPaymentAndRebuild(trx, request.paymentId, 'confirmed', 'refunded');
      if (!transitioned) return 'payment_not_confirmed' as const;

      await trx
        .update(premiumRefundRequests)
        .set({ refundTxHash, processedAt: new Date() })
        .where(eq(premiumRefundRequests.id, requestId));

      return 'processed' as const;
    }),
  );

  // The refund was verifiably sent but the request cannot be completed (the payment stopped being
  // 'confirmed' after a reorg, or the request was dismissed mid-flight). Record the hash as evidence
  // on the row so the money trail is never lost, and surface the state for manual review.
  if (outcome === 'payment_not_confirmed' || outcome === 'request_dismissed') {
    await recordRefundTxHashForReview(requestId, refundTxHash);

    const reason = outcome === 'request_dismissed' ? 'Refund request was dismissed' : 'Payment is no longer refundable';
    throw new PremiumRefundError(`${reason}; the refund transaction was recorded for manual review`);
  }

  return { outcome, ownerAddress, subscriptionId };
};

const recordRefundTxHashForReview = async (requestId: string, refundTxHash: Hash): Promise<void> => {
  await runMappingUniqueViolations(() =>
    getDb()
      .update(premiumRefundRequests)
      .set({ refundTxHash })
      .where(
        and(
          eq(premiumRefundRequests.id, requestId),
          isNull(premiumRefundRequests.processedAt),
          isNull(premiumRefundRequests.refundTxHash),
        ),
      ),
  );
};

// The partial unique index on refund_tx_hash backstops one-refund-per-request; surface violations
// as a clear operator error instead of a raw 500
const runMappingUniqueViolations = async <Result>(operation: () => Promise<Result>): Promise<Result> => {
  try {
    return await operation();
  } catch (error) {
    if (isUniqueViolationError(error)) {
      throw new PremiumRefundError('This refund transaction is already recorded on another refund request', 409);
    }
    throw error;
  }
};

const verifyRefundTransfer = async (
  payment: typeof premiumPayments.$inferSelect,
  refundTxHash: Hash,
  refundAmountUsdCents: number,
): Promise<void> => {
  const publicClient = createViemPublicClientForChain(payment.chainId);

  const receipt = await publicClient.getTransactionReceipt({ hash: refundTxHash }).catch((error) => {
    if (error instanceof TransactionReceiptNotFoundError) return null;
    throw error;
  });

  if (receipt?.status !== 'success') {
    throw new PremiumRefundError('Refund transaction was not found on-chain or did not succeed');
  }

  const expectedAmount = usdCentsToTokenUnits(refundAmountUsdCents, payment.tokenDecimals);

  const containsRefundTransfer = receipt.logs.some((log) => {
    if (!isAddressEqual(log.address, payment.tokenAddress)) return false;

    try {
      const decoded = decodeEventLog({ abi: ERC20_ABI, data: log.data, topics: log.topics, eventName: 'Transfer' });
      return isAddressEqual(decoded.args.to, payment.ownerAddress) && decoded.args.amount >= expectedAmount;
    } catch {
      return false;
    }
  });

  if (!containsRefundTransfer) {
    throw new PremiumRefundError('Refund transaction does not contain a matching token transfer to the owner address');
  }
};
