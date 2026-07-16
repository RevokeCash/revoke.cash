import { getDb, getTransactionalDb } from '@revoke.cash/core/db/client';
import { premiumPayments, premiumTransferScanCursors } from '@revoke.cash/core/db/schema/premium';
import { isUniqueViolationError } from '@revoke.cash/core/db/utils';
import { ERC20_TRANSFER_TOPIC, type Log, parseTransferLog, TokenEventType } from '@revoke.cash/core/events';
import { getScriptLogsProvider } from '@revoke.cash/core/events/providers';
import { addressToTopic } from '@revoke.cash/core/events/utils';
import { and, eq } from 'drizzle-orm';
import type { Address, Hash } from 'viem';
import {
  getPaymentConfig,
  type PaymentConfig,
  PREMIUM_PAYMENT_CHAIN_IDS,
  usdCentsToTokenUnits,
} from './payment-config';
import { getPremiumPlans, type PremiumPlan } from './plans';
import { findOrCreateSubscriptionForOwner, rebuildSubscriptionFromPayments } from './subscriptions';
import {
  finalizeMatchedPaymentInTransaction,
  matchablePaymentStatusConditions,
  trackSubscriptionActivated,
} from './verify-payment';

// Rescanned on every run so short reorgs cannot make us miss a transfer; processing is idempotent
// because credited transfers are recognized by their transaction hash
const REORG_RESCAN_BLOCKS = 100;

// Bounds each run's getLogs range so catching up after downtime cannot exceed RPC range limits
const MAX_SCAN_BLOCKS_PER_RUN = 10_000;

export interface SettleIncomingTransfersResult {
  transfers: number;
  alreadyLinked: number;
  settledIntoExisting: number;
  createdPayments: number;
  belowMinimumAmount: number;
  deferred: number;
  errors: number;
}

// The inverse of quote-based reconciliation: scan every USDC transfer sent to the subscriptions
// address and make sure each one credits a subscription. Transfers first settle into an unmatched
// quote from the same sender; without one, a settled payment is created on the spot.
//
// Known limitations: the on-chain sender is trusted as the subscription owner, so transfers
// originating from exchange custody or contracts credit the sending address (payments must come
// from the owner wallet, as documented at checkout). Credits are keyed by transaction hash, so a
// single transaction carrying multiple qualifying transfers credits only one payment.
export const settleIncomingTransfers = async (): Promise<SettleIncomingTransfersResult> => {
  const result: SettleIncomingTransfersResult = {
    transfers: 0,
    alreadyLinked: 0,
    settledIntoExisting: 0,
    createdPayments: 0,
    belowMinimumAmount: 0,
    deferred: 0,
    errors: 0,
  };

  const plans = await getPremiumPlans();

  await Promise.all(
    PREMIUM_PAYMENT_CHAIN_IDS.map(async (chainId) => {
      try {
        await settleIncomingTransfersForChain(chainId, plans, result);
      } catch (error) {
        console.error(`Failed to settle incoming transfers on chain ${chainId}:`, error);
        result.errors += 1;
      }
    }),
  );

  return result;
};

const settleIncomingTransfersForChain = async (
  chainId: number,
  plans: PremiumPlan[],
  result: SettleIncomingTransfersResult,
): Promise<void> => {
  const paymentConfig = getPaymentConfig(chainId);
  if (!paymentConfig) return;

  const logsProvider = getScriptLogsProvider(chainId);
  const latestBlock = await logsProvider.getLatestBlock();

  const fromBlock = await getScanStartBlock(chainId, latestBlock);
  if (fromBlock > latestBlock) return;

  const toBlock = Math.min(latestBlock, fromBlock + MAX_SCAN_BLOCKS_PER_RUN - 1);

  const logs = await logsProvider.getLogs({
    address: paymentConfig.token.address,
    topics: [ERC20_TRANSFER_TOPIC, null, addressToTopic(paymentConfig.paymentAddress)],
    fromBlock,
    toBlock,
  });

  // A transfer that could not be settled this run must be scanned again, so the cursor never
  // advances past the earliest unsettled transfer
  const unsettledBlocks: number[] = [];

  for (const log of logs) {
    try {
      const outcome = await settleTransfer(log, chainId, paymentConfig, plans, result);
      if (outcome === 'deferred') unsettledBlocks.push(log.blockNumber);
    } catch (error) {
      console.error(`Failed to settle transfer ${log.transactionHash} on chain ${chainId}:`, error);
      result.errors += 1;
      unsettledBlocks.push(log.blockNumber);
    }
  }

  const cursorBlock = unsettledBlocks.length > 0 ? Math.min(...unsettledBlocks) - 1 : toBlock;

  await saveScanCursor(chainId, cursorBlock);
};

const getScanStartBlock = async (chainId: number, latestBlock: number): Promise<number> => {
  const db = getDb();

  const cursor = await db.query.premiumTransferScanCursors.findFirst({
    where: eq(premiumTransferScanCursors.chainId, chainId),
  });

  const nextBlock = cursor ? Number(cursor.lastScannedBlock) + 1 : latestBlock;
  return Math.max(nextBlock - REORG_RESCAN_BLOCKS, 0);
};

const saveScanCursor = async (chainId: number, lastScannedBlock: number): Promise<void> => {
  const db = getDb();

  await db
    .insert(premiumTransferScanCursors)
    .values({ chainId, lastScannedBlock: BigInt(lastScannedBlock) })
    .onConflictDoUpdate({
      target: premiumTransferScanCursors.chainId,
      set: { lastScannedBlock: BigInt(lastScannedBlock), updatedAt: new Date() },
    });
};

interface IncomingTransfer {
  senderAddress: Address;
  amount: bigint;
  txHash: Hash;
  blockNumber: bigint;
}

type SettleOutcome = 'settled' | 'deferred';

const settleTransfer = async (
  log: Log,
  chainId: number,
  paymentConfig: PaymentConfig,
  plans: PremiumPlan[],
  result: SettleIncomingTransfersResult,
): Promise<SettleOutcome> => {
  const transfer = parseIncomingTransfer(log, chainId);
  if (!transfer) return 'settled';

  result.transfers += 1;

  const linkedPayment = await getDb().query.premiumPayments.findFirst({
    where: eq(premiumPayments.matchedTxHash, transfer.txHash),
    columns: { id: true },
  });

  if (linkedPayment) {
    result.alreadyLinked += 1;
    return 'settled';
  }

  const existingSettlement = await settleIntoExistingPayment(transfer, chainId, paymentConfig);
  if (existingSettlement.outcome === 'settled') {
    result.settledIntoExisting += 1;
    await trackSubscriptionActivated(existingSettlement.payment.ownerAddress, {
      paymentId: existingSettlement.payment.id,
      planId: existingSettlement.payment.planId,
      chainId,
      amountUsdCents: existingSettlement.payment.amountUsdCents,
    });
    return 'settled';
  }

  // A candidate quote existed but couldn't be finalized this run (locked by a concurrent reconcile,
  // or claimed by a sibling between selection and finalization); retry instead of creating a settled
  // payment that would claim the transfer out from under it
  if (existingSettlement.outcome === 'contended') {
    result.deferred += 1;
    return 'deferred';
  }

  // The most expensive active plan the transferred amount covers
  const coveredPlan = plans
    .filter((plan) => usdCentsToTokenUnits(plan.priceUsdCents, paymentConfig.token.decimals) <= transfer.amount)
    .at(-1);

  if (!coveredPlan) {
    console.warn(`Unmatched transfer below minimum plan price: ${transfer.txHash} on chain ${chainId}`);
    result.belowMinimumAmount += 1;
    return 'settled';
  }

  const createdPayment = await createSettledPayment(transfer, chainId, paymentConfig, coveredPlan);
  if (createdPayment) {
    result.createdPayments += 1;
    await trackSubscriptionActivated(transfer.senderAddress, {
      paymentId: createdPayment.id,
      planId: coveredPlan.id,
      chainId,
      amountUsdCents: coveredPlan.priceUsdCents,
    });
  } else {
    result.alreadyLinked += 1;
  }

  return 'settled';
};

const parseIncomingTransfer = (log: Log, chainId: number): IncomingTransfer | null => {
  const transfer = parseTransferLog(log, chainId, log.address);
  if (transfer?.type !== TokenEventType.TRANSFER_ERC20) return null;

  return {
    senderAddress: transfer.payload.from,
    amount: transfer.payload.amount,
    txHash: log.transactionHash,
    blockNumber: BigInt(log.blockNumber),
  };
};

type ExistingPaymentSettlement =
  | { outcome: 'settled'; payment: { id: string; ownerAddress: string; planId: string; amountUsdCents: number } }
  | { outcome: 'contended' }
  | { outcome: 'no_candidate' };

// Credits the transfer to an unmatched quote from the same sender. Expired quotes stay eligible
// for the same window as the poll path; preference order is exact amount match, then the most
// expensive quote the amount covers, then pending over expired, then newest.
const settleIntoExistingPayment = async (
  transfer: IncomingTransfer,
  chainId: number,
  paymentConfig: PaymentConfig,
): Promise<ExistingPaymentSettlement> => {
  const db = getTransactionalDb();

  const candidatePayments = await db.query.premiumPayments.findMany({
    where: and(
      eq(premiumPayments.ownerAddress, transfer.senderAddress),
      eq(premiumPayments.chainId, chainId),
      eq(premiumPayments.tokenAddress, paymentConfig.token.address),
      matchablePaymentStatusConditions(),
    ),
    columns: { id: true, amountUsdCents: true, tokenDecimals: true, status: true, createdAt: true },
  });

  const expectedAmount = (payment: { amountUsdCents: number; tokenDecimals: number }) =>
    usdCentsToTokenUnits(payment.amountUsdCents, payment.tokenDecimals);

  const targetPayment = candidatePayments
    .filter((payment) => expectedAmount(payment) <= transfer.amount)
    .sort((a, b) => {
      const aExact = expectedAmount(a) === transfer.amount;
      const bExact = expectedAmount(b) === transfer.amount;
      if (aExact !== bExact) return aExact ? -1 : 1;
      if (expectedAmount(a) !== expectedAmount(b)) return expectedAmount(b) > expectedAmount(a) ? 1 : -1;
      if (a.status !== b.status) return a.status === 'pending' ? -1 : 1;
      return b.createdAt.getTime() - a.createdAt.getTime();
    })[0];

  if (!targetPayment) return { outcome: 'no_candidate' };

  return db.transaction(async (trx) => {
    const [lockedPayment] = await trx
      .select({ id: premiumPayments.id })
      .from(premiumPayments)
      .where(eq(premiumPayments.id, targetPayment.id))
      .for('update', { skipLocked: true });

    // Locked by a concurrent reconcile right now; retry next run
    if (!lockedPayment) return { outcome: 'contended' as const };

    const confirmedPayment = await finalizeMatchedPaymentInTransaction(trx, {
      paymentId: targetPayment.id,
      matchedTxHash: transfer.txHash,
    });

    // Finalization no-opped: the candidate was already settled or a sibling claimed the transfer
    if (!confirmedPayment) return { outcome: 'contended' as const };

    return { outcome: 'settled' as const, payment: confirmedPayment };
  });
};

// Without a quote to settle into, the money still credits a subscription: record a payment for the
// most expensive plan the amount covers and apply it
const createSettledPayment = async (
  transfer: IncomingTransfer,
  chainId: number,
  paymentConfig: PaymentConfig,
  plan: PremiumPlan,
) => {
  const db = getTransactionalDb();

  try {
    return await db.transaction(async (trx) => {
      const now = new Date();

      const subscriptionId = await findOrCreateSubscriptionForOwner(trx, {
        ownerAddress: transfer.senderAddress,
        planId: plan.id,
        planVersion: plan.version,
        plan,
        now,
      });

      const [insertedPayment] = await trx
        .insert(premiumPayments)
        .values({
          planId: plan.id,
          planVersion: plan.version,
          ownerAddress: transfer.senderAddress,
          subscriptionId,
          chainId,
          tokenAddress: paymentConfig.token.address,
          tokenSymbol: paymentConfig.token.symbol,
          tokenDecimals: paymentConfig.token.decimals,
          amountUsdCents: plan.priceUsdCents,
          status: 'confirmed',
          expiresAt: now,
          scanFromBlock: transfer.blockNumber,
          matchedTxHash: transfer.txHash,
          confirmedAt: now,
        })
        .returning({ id: premiumPayments.id });

      await rebuildSubscriptionFromPayments(trx, subscriptionId);

      return insertedPayment;
    });
  } catch (error) {
    // A concurrent run claimed the transfer first; the unique index on the hash rejects the insert
    if (isUniqueViolationError(error, 'idx_payments_matched_tx_hash_unique')) {
      return null;
    }
    throw error;
  }
};
