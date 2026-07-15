import { ERC20_ABI } from '@revoke.cash/core/abis';
import { type DatabaseTransaction, getDb, getTransactionalDb } from '@revoke.cash/core/db/client';
import { premiumPayments } from '@revoke.cash/core/db/schema/premium';
import { parseTransferLog, TokenEventType } from '@revoke.cash/core/events';
import { getScriptLogsProvider } from '@revoke.cash/core/events/providers';
import { addressToTopic } from '@revoke.cash/core/events/utils';
import { and, eq, ne } from 'drizzle-orm';
import { type Address, getAbiItem, type Hash, toEventSelector } from 'viem';
import { getPaymentConfig, usdCentsToTokenUnits } from './payment-config';
import {
  getPaymentForOwner,
  type PaymentStatusResponse,
  type PremiumPaymentRecord,
  type PremiumPaymentStatus,
  toPaymentStatusResponse,
} from './payments';
import { findOrCreateSubscriptionForOwner, rebuildSubscriptionFromPayments } from './subscriptions';

interface SetPaymentStatusParams {
  paymentId: string;
  status: PremiumPaymentStatus;
  matchedTxHash?: Hash | null;
  confirmedAt?: Date | null;
  subscriptionId?: string;
  updatedAt?: Date;
}

interface ReconcilePendingPaymentsResult {
  processed: number;
  pending: number;
  confirmed: number;
  expired: number;
  failed: number;
  reversed: number;
  refunded: number;
  errors: number;
}

export const reconcilePendingPayments = async (limit = 20): Promise<ReconcilePendingPaymentsResult> => {
  const db = getDb();

  const boundedLimit = Math.min(limit, 100);

  const pendingPayments = await db.query.premiumPayments.findMany({
    where: eq(premiumPayments.status, 'pending'),
    orderBy: (payments, { asc }) => [asc(payments.createdAt)],
    columns: { id: true, ownerAddress: true },
    limit: boundedLimit,
  });

  const result: ReconcilePendingPaymentsResult = {
    processed: pendingPayments.length,
    pending: 0,
    confirmed: 0,
    expired: 0,
    failed: 0,
    reversed: 0,
    refunded: 0,
    errors: 0,
  };

  for (const pendingPayment of pendingPayments) {
    try {
      const reconciliationResult = await reconcilePaymentByOwner(pendingPayment.id, pendingPayment.ownerAddress);
      if (!reconciliationResult) continue;
      result[reconciliationResult.status] += 1;
    } catch (error) {
      console.error(`Failed to reconcile payment ${pendingPayment.id}:`, error);
      result.errors += 1;
    }
  }

  return result;
};

export const reconcilePaymentByOwner = async (
  paymentId: string,
  ownerAddress: Address,
): Promise<PaymentStatusResponse | null> => {
  const db = getTransactionalDb();

  const payment = await getPaymentForOwner(paymentId, ownerAddress);
  if (!payment) return null;

  if (payment.status !== 'pending') {
    return toPaymentStatusResponse(payment);
  }

  // Use a transaction for all status updates to prevent TOCTOU races
  return db.transaction(async (trx) => {
    const lockedPayment = await lockPendingPayment(trx, payment.id);
    if (!lockedPayment) return toPaymentStatusResponse(payment);

    if (lockedPayment.status !== 'pending') {
      return { paymentId: payment.id, status: lockedPayment.status, matchedTxHash: lockedPayment.matchedTxHash };
    }

    const paymentConfig = getPaymentConfig(payment.chainId);
    if (!paymentConfig) {
      await setPaymentStatus(trx, { paymentId: payment.id, status: 'failed' });
      return { ...toPaymentStatusResponse(payment), status: 'failed' as const };
    }

    const matchedTxHash = await findMatchingTransferTxHash(payment, ownerAddress, paymentConfig.paymentAddress);
    if (!matchedTxHash) {
      if (payment.expiresAt.getTime() <= Date.now()) {
        await setPaymentStatus(trx, { paymentId: payment.id, status: 'expired' });
        return { ...toPaymentStatusResponse(payment), status: 'expired' as const };
      }

      return toPaymentStatusResponse(payment);
    }

    await finalizeMatchedPaymentInTransaction(trx, { paymentId: payment.id, matchedTxHash });

    const updatedPayment = await getPaymentForOwner(payment.id, ownerAddress);
    if (!updatedPayment) return null;

    return toPaymentStatusResponse(updatedPayment);
  });
};

const lockPendingPayment = async (
  trx: DatabaseTransaction,
  paymentId: string,
): Promise<{ status: PremiumPaymentStatus; matchedTxHash: Hash | null } | null> => {
  const [lockedPayment] = await trx
    .select({ status: premiumPayments.status, matchedTxHash: premiumPayments.matchedTxHash })
    .from(premiumPayments)
    .where(eq(premiumPayments.id, paymentId))
    .for('update', { skipLocked: true });

  return lockedPayment ?? null;
};

export const findMatchingTransferTxHash = async (
  payment: PremiumPaymentRecord,
  ownerAddress: Address,
  recipientAddress: Address,
): Promise<Hash | null> => {
  // We get the script logs provider since this only runs on the backend.
  const logsProvider = getScriptLogsProvider(payment.chainId);
  const latestBlock = await logsProvider.getLatestBlock();

  const logs = await logsProvider.getLogs({
    address: payment.tokenAddress,
    topics: [
      toEventSelector(getAbiItem({ abi: ERC20_ABI, name: 'Transfer' })),
      addressToTopic(ownerAddress),
      addressToTopic(recipientAddress),
    ],
    fromBlock: Number(payment.scanFromBlock),
    toBlock: latestBlock,
  });

  const expectedAmount = getExpectedTokenAmount(payment);
  const siblingPaymentAmounts = await getSiblingPendingPaymentAmounts(payment);

  // Since sender/receiver are topic-matched, we only need an amount check.
  // We intentionally accept >= expectedAmount to allow overpayments, but a transfer that exactly
  // matches another pending payment's amount belongs to that payment (e.g. a pending $99 Premium
  // quote must not consume the $199 transfer paying for a newer Ultimate quote).
  const matchedTransfer = logs
    .map((log) => parseTransferLog(log, payment.chainId, ownerAddress))
    .find(
      (transfer) =>
        transfer?.type === TokenEventType.TRANSFER_ERC20 &&
        transfer.payload.amount >= expectedAmount &&
        !siblingPaymentAmounts.includes(transfer.payload.amount),
    );

  return matchedTransfer?.rawLog.transactionHash ?? null;
};

// Expected amounts of the owner's other pending payments for the same token. Amounts equal to this
// payment's own expected amount are not reserved: identical quotes may race for the same transfer,
// and the unique index on the matched transaction hash ensures only one of them confirms with it.
const getSiblingPendingPaymentAmounts = async (payment: PremiumPaymentRecord): Promise<bigint[]> => {
  const siblingPayments = await getDb().query.premiumPayments.findMany({
    where: and(
      eq(premiumPayments.ownerAddress, payment.ownerAddress),
      eq(premiumPayments.chainId, payment.chainId),
      eq(premiumPayments.tokenAddress, payment.tokenAddress),
      eq(premiumPayments.status, 'pending'),
      ne(premiumPayments.id, payment.id),
    ),
    columns: { amountUsdCents: true, tokenDecimals: true },
  });

  const expectedAmount = getExpectedTokenAmount(payment);

  return siblingPayments
    .map((sibling) => usdCentsToTokenUnits(sibling.amountUsdCents, sibling.tokenDecimals))
    .filter((amount) => amount !== expectedAmount);
};

const finalizeMatchedPaymentInTransaction = async (
  trx: DatabaseTransaction,
  { paymentId, matchedTxHash }: { paymentId: string; matchedTxHash: Hash },
): Promise<void> => {
  const lockedPayment = await trx.query.premiumPayments.findFirst({
    where: eq(premiumPayments.id, paymentId),
    with: { plan: { columns: { durationDays: true, priceUsdCents: true } } },
  });

  if (lockedPayment?.status !== 'pending') {
    return;
  }

  const existingTxUse = await trx.query.premiumPayments.findFirst({
    where: and(eq(premiumPayments.matchedTxHash, matchedTxHash), ne(premiumPayments.id, lockedPayment.id)),
    columns: { id: true },
  });

  if (existingTxUse) {
    await setPaymentStatus(trx, { paymentId: lockedPayment.id, status: 'failed' });
    return;
  }

  const now = new Date();
  const subscriptionId = await findOrCreateSubscriptionForOwner(trx, { ...lockedPayment, now });

  await setPaymentStatus(trx, {
    paymentId: lockedPayment.id,
    status: 'confirmed',
    matchedTxHash,
    confirmedAt: now,
    updatedAt: now,
    subscriptionId,
  });

  await rebuildSubscriptionFromPayments(trx, subscriptionId);
};

const setPaymentStatus = async (
  trx: DatabaseTransaction,
  { paymentId, status, matchedTxHash, confirmedAt, subscriptionId, updatedAt = new Date() }: SetPaymentStatusParams,
): Promise<void> => {
  await trx
    .update(premiumPayments)
    .set({
      status,
      updatedAt,
      ...(matchedTxHash !== undefined ? { matchedTxHash } : {}),
      ...(confirmedAt !== undefined ? { confirmedAt } : {}),
      ...(subscriptionId !== undefined ? { subscriptionId } : {}),
    })
    .where(eq(premiumPayments.id, paymentId));
};

const getExpectedTokenAmount = (payment: PremiumPaymentRecord): bigint => {
  return usdCentsToTokenUnits(payment.amountUsdCents, payment.tokenDecimals);
};
