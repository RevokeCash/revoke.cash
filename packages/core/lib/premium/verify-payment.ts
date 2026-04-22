import { ERC20_ABI } from '@revoke.cash/core/abis';
import { type DatabaseTransaction, getDb, getTransactionalDb } from '@revoke.cash/core/db/client';
import {
  premiumPayments,
  premiumSubscriptionAddresses,
  premiumSubscriptions,
} from '@revoke.cash/core/db/schema/premium';
import { parseTransferLog, TokenEventType } from '@revoke.cash/core/events';
import { getScriptLogsProvider } from '@revoke.cash/core/events/providers';
import { addressToTopic } from '@revoke.cash/core/events/utils';
import { DAY } from '@revoke.cash/core/utils/time';
import { and, eq, gt, ne, sql } from 'drizzle-orm';
import { type Address, getAbiItem, getAddress, parseUnits, toEventSelector } from 'viem';
import { getPaymentConfig } from './payment-config';
import {
  getPaymentForOwner,
  type PaymentStatusResponse,
  type PremiumPaymentRecord,
  type PremiumPaymentStatus,
  toPaymentStatusResponse,
} from './payments';

interface SetPaymentStatusParams {
  paymentId: string;
  status: PremiumPaymentStatus;
  matchedTxHash?: string | null;
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
    errors: 0,
  };

  for (const pendingPayment of pendingPayments) {
    try {
      const ownerAddress = getAddress(pendingPayment.ownerAddress);
      const reconciliationResult = await reconcilePaymentByOwner(pendingPayment.id, ownerAddress);
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
    if (payment.expiresAt.getTime() <= Date.now()) {
      await setPaymentStatus(trx, { paymentId: payment.id, status: 'expired' });
      return { ...toPaymentStatusResponse(payment), status: 'expired' as const };
    }

    const paymentConfig = getPaymentConfig(payment.chainId);
    if (!paymentConfig) {
      await setPaymentStatus(trx, { paymentId: payment.id, status: 'failed' });
      return { ...toPaymentStatusResponse(payment), status: 'failed' as const };
    }

    const matchedTxHash = await findMatchingTransferTxHash(payment, ownerAddress, paymentConfig.paymentAddress);
    if (!matchedTxHash) {
      return toPaymentStatusResponse(payment);
    }

    await finalizeMatchedPaymentInTransaction(trx, { paymentId: payment.id, matchedTxHash });

    const updatedPayment = await getPaymentForOwner(payment.id, ownerAddress);
    if (!updatedPayment) return null;

    return toPaymentStatusResponse(updatedPayment);
  });
};

const findMatchingTransferTxHash = async (
  payment: PremiumPaymentRecord,
  ownerAddress: Address,
  recipientAddress: Address,
): Promise<string | null> => {
  // We get the script logs provider since this only runs on the backend.
  const logsProvider = getScriptLogsProvider(payment.chainId);
  const latestBlock = await logsProvider.getLatestBlock();

  const logs = await logsProvider.getLogs({
    address: getAddress(payment.tokenAddress),
    topics: [
      toEventSelector(getAbiItem({ abi: ERC20_ABI, name: 'Transfer' })),
      addressToTopic(ownerAddress),
      addressToTopic(recipientAddress),
    ],
    fromBlock: Number(payment.scanFromBlock),
    toBlock: latestBlock,
  });

  const expectedAmount = getExpectedTokenAmount(payment);

  // Since sender/receiver are topic-matched, we only need an amount check.
  // We intentionally accept >= expectedAmount to allow overpayments.
  const matchedTransfer = logs
    .map((log) => parseTransferLog(log, payment.chainId, ownerAddress))
    .find((transfer) => transfer?.type === TokenEventType.TRANSFER_ERC20 && transfer.payload.amount >= expectedAmount);

  return matchedTransfer?.rawLog.transactionHash ?? null;
};

type LockedPayment = PremiumPaymentRecord & {
  plan: { durationDays: number; priceUsd: number };
};

interface ExistingSubscription {
  id: string;
  planId: string;
  plan: { priceUsd: number };
}

const finalizeMatchedPaymentInTransaction = async (
  trx: DatabaseTransaction,
  { paymentId, matchedTxHash }: { paymentId: string; matchedTxHash: string },
): Promise<void> => {
  const lockedPayment = await trx.query.premiumPayments.findFirst({
    where: eq(premiumPayments.id, paymentId),
    with: { plan: { columns: { durationDays: true, priceUsd: true } } },
  });

  if (!lockedPayment || lockedPayment.status !== 'pending') {
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
  const subscriptionId = await extendOrCreateSubscription(trx, lockedPayment, now);

  await setPaymentStatus(trx, {
    paymentId: lockedPayment.id,
    status: 'confirmed',
    matchedTxHash,
    confirmedAt: now,
    updatedAt: now,
    subscriptionId,
  });
};

const extendOrCreateSubscription = async (
  trx: DatabaseTransaction,
  payment: LockedPayment,
  now: Date,
): Promise<string> => {
  const existing = await trx.query.premiumSubscriptions.findFirst({
    where: and(eq(premiumSubscriptions.ownerAddress, payment.ownerAddress), gt(premiumSubscriptions.endsAt, now)),
    orderBy: (sub, { desc }) => [desc(sub.endsAt)],
    columns: { id: true, planId: true },
    with: { plan: { columns: { priceUsd: true } } },
  });

  if (existing) {
    return extendExistingSubscription(trx, existing, payment);
  }

  return createNewSubscription(trx, payment, now);
};

const extendExistingSubscription = async (
  trx: DatabaseTransaction,
  existing: ExistingSubscription,
  payment: LockedPayment,
): Promise<string> => {
  const isUpgrade = payment.planId !== existing.planId && payment.plan.priceUsd > existing.plan.priceUsd;

  await trx
    .update(premiumSubscriptions)
    .set({
      endsAt: sql`${premiumSubscriptions.endsAt} + make_interval(days => ${payment.plan.durationDays})`,
      ...(isUpgrade ? { planId: payment.planId, planVersion: payment.planVersion } : {}),
    })
    .where(eq(premiumSubscriptions.id, existing.id));

  return existing.id;
};

const createNewSubscription = async (trx: DatabaseTransaction, payment: LockedPayment, now: Date): Promise<string> => {
  const [subscription] = await trx
    .insert(premiumSubscriptions)
    .values({
      planId: payment.planId,
      planVersion: payment.planVersion,
      ownerAddress: payment.ownerAddress,
      startsAt: now,
      endsAt: new Date(now.getTime() + payment.plan.durationDays * DAY),
    })
    .returning({ id: premiumSubscriptions.id });

  await trx
    .insert(premiumSubscriptionAddresses)
    .values({
      subscriptionId: subscription.id,
      address: payment.ownerAddress,
      addedBy: payment.ownerAddress,
    })
    .onConflictDoNothing();

  return subscription.id;
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
  return parseUnits(String(payment.amountUsd), payment.tokenDecimals);
};
