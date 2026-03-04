import { and, eq, gt, ne } from 'drizzle-orm';
import { ERC20_ABI } from 'lib/abis';
import { type DatabaseTransaction, getDb, getTransactionalDb } from 'lib/db/client';
import { premiumPaymentIntents, premiumSubscriptionAddresses, premiumSubscriptions } from 'lib/db/schema/premium';
import { getScriptLogsProvider } from 'lib/ScriptLogsProvider';
import { addressToTopic } from 'lib/utils';
import { parseTransferLog, TokenEventType } from 'lib/utils/events';
import { DAY } from 'lib/utils/time';
import { type Address, getAbiItem, getAddress, parseUnits, toEventSelector } from 'viem';
import {
  getPaymentIntentForOwner,
  type PaymentIntentStatusResponse,
  type PremiumPaymentIntentRecord,
  type PremiumPaymentIntentStatus,
  toPaymentIntentStatusResponse,
} from './intents';
import { getPaymentConfig } from './payment-config';

interface SetPaymentIntentStatusParams {
  intentId: string;
  status: PremiumPaymentIntentStatus;
  matchedTxHash?: string | null;
  confirmedAt?: Date | null;
  updatedAt?: Date;
}

interface ReconcilePendingPaymentIntentsResult {
  processed: number;
  pending: number;
  confirmed: number;
  expired: number;
  failed: number;
  errors: number;
}

export const reconcilePendingPaymentIntents = async (limit = 20): Promise<ReconcilePendingPaymentIntentsResult> => {
  const db = getDb();

  const boundedLimit = Math.min(limit, 100);

  const pendingIntents = await db.query.premiumPaymentIntents.findMany({
    where: eq(premiumPaymentIntents.status, 'pending'),
    orderBy: (paymentIntents, { asc }) => [asc(paymentIntents.createdAt)],
    columns: { id: true, ownerAddress: true },
    limit: boundedLimit,
  });

  const result: ReconcilePendingPaymentIntentsResult = {
    processed: pendingIntents.length,
    pending: 0,
    confirmed: 0,
    expired: 0,
    failed: 0,
    errors: 0,
  };

  for (const intent of pendingIntents) {
    try {
      const ownerAddress = getAddress(intent.ownerAddress);
      const reconciliationResult = await reconcilePaymentIntentByOwner(intent.id, ownerAddress);
      if (!reconciliationResult) continue;
      result[reconciliationResult.status] += 1;
    } catch (error) {
      console.error(`Failed to reconcile intent ${intent.id}:`, error);
      result.errors += 1;
    }
  }

  return result;
};

export const reconcilePaymentIntentByOwner = async (
  intentId: string,
  ownerAddress: Address,
): Promise<PaymentIntentStatusResponse | null> => {
  const db = getTransactionalDb();

  const intent = await getPaymentIntentForOwner(intentId, ownerAddress);
  if (!intent) return null;

  if (intent.status !== 'pending') {
    return toPaymentIntentStatusResponse(intent);
  }

  // Use a transaction for all status updates to prevent TOCTOU races
  return db.transaction(async (trx) => {
    if (intent.expiresAt.getTime() <= Date.now()) {
      await setPaymentIntentStatus(trx, { intentId: intent.id, status: 'expired' });
      return { ...toPaymentIntentStatusResponse(intent), status: 'expired' as const };
    }

    const paymentConfig = getPaymentConfig(intent.chainId);
    if (!paymentConfig) {
      await setPaymentIntentStatus(trx, { intentId: intent.id, status: 'failed' });
      return { ...toPaymentIntentStatusResponse(intent), status: 'failed' as const };
    }

    const matchedTxHash = await findMatchingTransferTxHash(intent, ownerAddress, paymentConfig.treasuryAddress);
    if (!matchedTxHash) {
      return toPaymentIntentStatusResponse(intent);
    }

    await finalizeMatchedIntentInTransaction(trx, { intentId: intent.id, matchedTxHash });

    const updatedIntent = await getPaymentIntentForOwner(intent.id, ownerAddress);
    if (!updatedIntent) return null;

    return toPaymentIntentStatusResponse(updatedIntent);
  });
};

const findMatchingTransferTxHash = async (
  intent: PremiumPaymentIntentRecord,
  ownerAddress: Address,
  recipientAddress: Address,
): Promise<string | null> => {
  // We get the script logs provider since this only runs on the backend.
  const logsProvider = getScriptLogsProvider(intent.chainId);
  const latestBlock = await logsProvider.getLatestBlock();

  const logs = await logsProvider.getLogs({
    address: getAddress(intent.tokenAddress),
    topics: [
      toEventSelector(getAbiItem({ abi: ERC20_ABI, name: 'Transfer' })),
      addressToTopic(ownerAddress),
      addressToTopic(recipientAddress),
    ],
    fromBlock: Number(intent.scanFromBlock),
    toBlock: latestBlock,
  });

  const expectedAmount = getExpectedTokenAmount(intent);

  // Since sender/receiver are topic-matched, we only need an amount check.
  // We intentionally accept >= expectedAmount to allow overpayments.
  const matchedTransfer = logs
    .map((log) => parseTransferLog(log, intent.chainId, ownerAddress))
    .find((transfer) => transfer?.type === TokenEventType.TRANSFER_ERC20 && transfer.payload.amount >= expectedAmount);

  return matchedTransfer?.rawLog.transactionHash ?? null;
};

const finalizeMatchedIntentInTransaction = async (
  trx: DatabaseTransaction,
  { intentId, matchedTxHash }: { intentId: string; matchedTxHash: string },
): Promise<void> => {
  const lockedIntent = await trx.query.premiumPaymentIntents.findFirst({
    where: eq(premiumPaymentIntents.id, intentId),
    with: { plan: { columns: { durationDays: true } } },
  });

  if (!lockedIntent || lockedIntent.status !== 'pending') {
    return;
  }

  if (!lockedIntent.plan) {
    await setPaymentIntentStatus(trx, {
      intentId: lockedIntent.id,
      status: 'failed',
    });
    return;
  }

  const existingTxUse = await trx.query.premiumPaymentIntents.findFirst({
    where: and(eq(premiumPaymentIntents.matchedTxHash, matchedTxHash), ne(premiumPaymentIntents.id, lockedIntent.id)),
    columns: { id: true },
  });

  if (existingTxUse) {
    await setPaymentIntentStatus(trx, {
      intentId: lockedIntent.id,
      status: 'failed',
    });
    return;
  }

  const now = new Date();

  const latestExistingSubscription = await trx.query.premiumSubscriptions.findFirst({
    where: and(
      eq(premiumSubscriptions.ownerAddress, lockedIntent.ownerAddress),
      eq(premiumSubscriptions.planId, lockedIntent.planId),
      gt(premiumSubscriptions.endsAt, now),
    ),
    orderBy: (subscriptions, { desc }) => [desc(subscriptions.endsAt)],
    columns: { endsAt: true },
  });

  const { startsAt, endsAt } = computeSubscriptionWindow(
    now,
    latestExistingSubscription?.endsAt ?? null,
    lockedIntent.plan.durationDays,
  );

  const [subscription] = await trx
    .insert(premiumSubscriptions)
    .values({
      planId: lockedIntent.planId,
      planVersion: lockedIntent.planVersion,
      ownerAddress: lockedIntent.ownerAddress,
      paymentIntentId: lockedIntent.id,
      startsAt,
      endsAt,
    })
    .returning({ id: premiumSubscriptions.id });

  await trx
    .insert(premiumSubscriptionAddresses)
    .values({
      subscriptionId: subscription.id,
      address: lockedIntent.ownerAddress,
      addedBy: lockedIntent.ownerAddress,
    })
    .onConflictDoNothing();

  await setPaymentIntentStatus(trx, {
    intentId: lockedIntent.id,
    status: 'confirmed',
    matchedTxHash,
    confirmedAt: now,
    updatedAt: now,
  });
};

const setPaymentIntentStatus = async (
  trx: DatabaseTransaction,
  { intentId, status, matchedTxHash, confirmedAt, updatedAt = new Date() }: SetPaymentIntentStatusParams,
): Promise<void> => {
  await trx
    .update(premiumPaymentIntents)
    .set({
      status,
      updatedAt,
      ...(matchedTxHash !== undefined ? { matchedTxHash } : {}),
      ...(confirmedAt !== undefined ? { confirmedAt } : {}),
    })
    .where(eq(premiumPaymentIntents.id, intentId));
};

const computeSubscriptionWindow = (
  now: Date,
  latestEndsAt: Date | null,
  durationDays: number,
): { startsAt: Date; endsAt: Date } => {
  const startsAt = latestEndsAt && latestEndsAt.getTime() > now.getTime() ? latestEndsAt : now;
  const endsAt = new Date(startsAt.getTime() + durationDays * DAY);
  return { startsAt, endsAt };
};

const getExpectedTokenAmount = (intent: PremiumPaymentIntentRecord): bigint => {
  return parseUnits(String(intent.amountUsd), intent.tokenDecimals);
};
