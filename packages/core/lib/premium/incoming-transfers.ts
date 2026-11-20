import { type DatabaseTransaction, getDb, getTransactionalDb } from '@revoke.cash/core/db/client';
import {
  premiumPayments,
  premiumTransferScanCursors,
  premiumUnmatchedTransfers,
} from '@revoke.cash/core/db/schema/premium';
import { acquireAdvisoryLock } from '@revoke.cash/core/db/utils';
import { ERC20_TRANSFER_TOPIC, type Log, parseTransferLog, TokenEventType } from '@revoke.cash/core/events';
import { getScriptLogsProvider } from '@revoke.cash/core/events/providers';
import { addressToTopic } from '@revoke.cash/core/events/utils';
import { trackServerEvent } from '@revoke.cash/core/utils/analytics';
import { and, eq, lt, notInArray } from 'drizzle-orm';
import { type Address, type Hash, isAddressEqual } from 'viem';
import { SUBSCRIPTIONS_ADDRESS } from '../constants';
import {
  getPaymentTokenByAddress,
  getPaymentTokens,
  type PaymentToken,
  PREMIUM_PAYMENT_CHAIN_IDS,
  usdCentsToTokenUnits,
} from './payment-config';
import {
  getPaymentForOwner,
  type PaymentStatusResponse,
  type PremiumPaymentRecord,
  toPaymentStatusResponse,
} from './payments';
import type { PremiumPlan } from './plans';
import { findOrCreateSubscriptionForOwner, rebuildSubscriptionFromPayments } from './subscriptions';

// Every run reads this many blocks before the cursor again, so a transfer that an RPC node left out or that a reorg
// moved is still found. Reading a transfer a second time changes nothing.
const RESCAN_BLOCKS = 1_500;

// Alchemy rejects larger getLogs ranges on BNB Chain
const MAX_SCAN_BLOCKS_PER_RUN = 5_000;

// Smaller transfers are dust and address poisoning, which are not worth showing to the admin
const UNMATCHED_TRANSFER_MINIMUM_USD_CENTS = 100;

export interface ProcessIncomingTransfersResult {
  confirmedPayments: number;
  unmatchedTransfers: number;
  expiredPayments: number;
  errors: number;
}

interface ChainScanResult {
  confirmedPayments: number;
  unmatchedTransfers: number;
  // false when the scan stopped before the latest block, so later transfers are still unread
  reachedLatestBlock: boolean;
}

interface IncomingTransfer {
  chainId: number;
  transactionHash: Hash;
  logIndex: number;
  paymentToken: PaymentToken;
  senderAddress: Address;
  amount: bigint;
}

type TransferOutcome = 'confirmed' | 'unmatched' | 'skipped';

type PendingPaymentWithPlan = PremiumPaymentRecord & { plan: Pick<PremiumPlan, 'durationDays' | 'priceUsdCents'> };

// The checkout polls this while it waits for the transfer. A pending payment first triggers a scan of its chain, so a
// transfer that just arrived confirms the payment without a wait for the cron.
export const getPaymentStatus = async (
  paymentId: string,
  ownerAddress: Address,
): Promise<PaymentStatusResponse | null> => {
  const payment = await getPaymentForOwner(paymentId, ownerAddress);
  if (!payment) return null;
  if (payment.status !== 'pending') return toPaymentStatusResponse(payment);

  // A failed scan leaves the payment pending. The cron run fails on the same error, and the admin health page shows it.
  await processIncomingTransfersForChain(payment.chainId).catch((error) => {
    console.error(`Failed to process incoming transfers on chain ${payment.chainId}:`, error);
  });

  const paymentAfterScan = await getPaymentForOwner(paymentId, ownerAddress);
  return paymentAfterScan ? toPaymentStatusResponse(paymentAfterScan) : null;
};

// Reads every transfer of a payment token to the subscriptions address. A transfer confirms the pending payment with
// the same owner (the sender), chain, token and amount. Every other transfer is stored as unmatched for the admin and
// never credits a subscription.
export const processIncomingTransfers = async (): Promise<ProcessIncomingTransfersResult> => {
  const scanStartedAt = new Date();

  const chainScans = await Promise.all(
    PREMIUM_PAYMENT_CHAIN_IDS.map(async (chainId) => {
      try {
        return { chainId, result: await processIncomingTransfersForChain(chainId) };
      } catch (error) {
        console.error(`Failed to process incoming transfers on chain ${chainId}:`, error);
        return { chainId, result: null };
      }
    }),
  );

  const chainIdsWithUnreadTransfers = chainScans
    .filter((chainScan) => !chainScan.result?.reachedLatestBlock)
    .map((chainScan) => chainScan.chainId);

  const expiredPayments = await expirePendingPayments(scanStartedAt, chainIdsWithUnreadTransfers);

  return {
    confirmedPayments: chainScans.reduce((total, chainScan) => total + (chainScan.result?.confirmedPayments ?? 0), 0),
    unmatchedTransfers: chainScans.reduce((total, chainScan) => total + (chainScan.result?.unmatchedTransfers ?? 0), 0),
    expiredPayments,
    errors: chainScans.filter((chainScan) => chainScan.result === null).length,
  };
};

const processIncomingTransfersForChain = async (chainId: number): Promise<ChainScanResult> => {
  const emptyScanResult = { confirmedPayments: 0, unmatchedTransfers: 0, reachedLatestBlock: true };

  if (getPaymentTokens(chainId).length === 0) return emptyScanResult;

  const logsProvider = getScriptLogsProvider(chainId);
  const latestBlock = await logsProvider.getLatestBlock();

  const fromBlock = await getScanStartBlock(chainId, latestBlock);
  if (fromBlock > latestBlock) return emptyScanResult;

  const toBlock = Math.min(latestBlock, fromBlock + MAX_SCAN_BLOCKS_PER_RUN - 1);

  const logs = await logsProvider.getLogs({
    topics: [ERC20_TRANSFER_TOPIC, null, addressToTopic(SUBSCRIPTIONS_ADDRESS)],
    fromBlock,
    toBlock,
  });

  // Transfers are processed in order, so the first of two transfers for one payment is the one that confirms it
  const outcomes: TransferOutcome[] = [];
  for (const log of logs) {
    outcomes.push(await processTransferLog(log, chainId));
  }

  // A transfer that fails throws before this point. The cursor then stays, the next run reads the same blocks again,
  // and the admin health page shows that the scan stopped.
  await saveScanCursor(chainId, toBlock);

  return {
    confirmedPayments: outcomes.filter((outcome) => outcome === 'confirmed').length,
    unmatchedTransfers: outcomes.filter((outcome) => outcome === 'unmatched').length,
    reachedLatestBlock: toBlock === latestBlock,
  };
};

const getScanStartBlock = async (chainId: number, latestBlock: number): Promise<number> => {
  const cursor = await getDb().query.premiumTransferScanCursors.findFirst({
    where: eq(premiumTransferScanCursors.chainId, chainId),
  });

  const nextBlock = cursor ? Number(cursor.lastScannedBlock) + 1 : latestBlock;
  return Math.max(nextBlock - RESCAN_BLOCKS, 0);
};

const saveScanCursor = async (chainId: number, lastScannedBlock: number): Promise<void> => {
  await getDb()
    .insert(premiumTransferScanCursors)
    .values({ chainId, lastScannedBlock: BigInt(lastScannedBlock) })
    .onConflictDoUpdate({
      target: premiumTransferScanCursors.chainId,
      set: { lastScannedBlock: BigInt(lastScannedBlock), updatedAt: new Date() },
    });
};

const processTransferLog = async (log: Log, chainId: number): Promise<TransferOutcome> => {
  const paymentToken = getPaymentTokenByAddress(chainId, log.address);
  if (!paymentToken) return 'skipped';

  const transferEvent = parseTransferLog(log, chainId, log.address);
  if (transferEvent?.type !== TokenEventType.TRANSFER_ERC20) return 'skipped';

  const transfer: IncomingTransfer = {
    chainId,
    transactionHash: log.transactionHash,
    logIndex: log.logIndex,
    paymentToken,
    senderAddress: transferEvent.payload.from,
    amount: transferEvent.payload.amount,
  };

  const { outcome, confirmedPayment } = await getTransactionalDb().transaction((trx) => processTransfer(trx, transfer));

  // Fires after the transaction commits, never for a rolled-back confirmation
  if (confirmedPayment) {
    await trackSubscriptionActivated(confirmedPayment);
  }

  return outcome;
};

const processTransfer = async (
  trx: DatabaseTransaction,
  transfer: IncomingTransfer,
): Promise<{ outcome: TransferOutcome; confirmedPayment?: PremiumPaymentRecord }> => {
  // The cron and the checkout poll can read the same transfer at the same time. Confirming a payment takes this same
  // lock, so the runs wait for each other here and the transfer ends in exactly one outcome.
  await acquireAdvisoryLock(trx, `premium_subscription_owner:${transfer.senderAddress.toLowerCase()}`);

  const paymentWithTransactionHash = await trx.query.premiumPayments.findFirst({
    where: eq(premiumPayments.matchedTxHash, transfer.transactionHash),
  });

  // An earlier run confirmed a payment with this transfer
  if (paymentWithTransactionHash && isPaymentForTransfer(paymentWithTransactionHash, transfer)) {
    return { outcome: 'skipped' };
  }

  // Not found by log index, because a reorg can give the same transfer another log index
  const storedUnmatchedTransfer = await trx.query.premiumUnmatchedTransfers.findFirst({
    where: and(
      eq(premiumUnmatchedTransfers.chainId, transfer.chainId),
      eq(premiumUnmatchedTransfers.transactionHash, transfer.transactionHash),
      eq(premiumUnmatchedTransfers.senderAddress, transfer.senderAddress),
      eq(premiumUnmatchedTransfers.tokenAddress, transfer.paymentToken.address),
      eq(premiumUnmatchedTransfers.amount, transfer.amount),
    ),
    columns: { id: true },
  });

  // An earlier run stored this transfer as unmatched. That is final: a payment created later does not claim it.
  if (storedUnmatchedTransfer) return { outcome: 'skipped' };

  // A transaction hash confirms one payment only (unique index), so every other transfer in a transaction that already
  // confirmed a payment is unmatched, also when it is from a second payer. Known limitation: a second transfer with
  // the same sender, token and amount in one transaction is not stored at all.
  const pendingPayment = paymentWithTransactionHash ? undefined : await findPendingPayment(trx, transfer);

  if (pendingPayment) {
    await confirmPayment(trx, pendingPayment, transfer.transactionHash);
    return { outcome: 'confirmed', confirmedPayment: pendingPayment };
  }

  const minimumAmount = usdCentsToTokenUnits(UNMATCHED_TRANSFER_MINIMUM_USD_CENTS, transfer.paymentToken.decimals);
  if (transfer.amount < minimumAmount) return { outcome: 'skipped' };

  await trx.insert(premiumUnmatchedTransfers).values({
    chainId: transfer.chainId,
    transactionHash: transfer.transactionHash,
    logIndex: transfer.logIndex,
    tokenAddress: transfer.paymentToken.address,
    tokenSymbol: transfer.paymentToken.symbol,
    tokenDecimals: transfer.paymentToken.decimals,
    senderAddress: transfer.senderAddress,
    amount: transfer.amount,
  });

  return { outcome: 'unmatched' };
};

// The single rule that links a transfer to a payment. Only the owner, or a spender that the owner approved, can move the
// owner's tokens, and at most one payment is pending per owner, chain, token and amount. These four fields thus
// identify the payment exactly.
const isPaymentForTransfer = (payment: PremiumPaymentRecord, transfer: IncomingTransfer): boolean => {
  return (
    isAddressEqual(payment.ownerAddress, transfer.senderAddress) &&
    payment.chainId === transfer.chainId &&
    isAddressEqual(payment.tokenAddress, transfer.paymentToken.address) &&
    usdCentsToTokenUnits(payment.amountUsdCents, payment.tokenDecimals) === transfer.amount
  );
};

const findPendingPayment = async (
  trx: DatabaseTransaction,
  transfer: IncomingTransfer,
): Promise<PendingPaymentWithPlan | undefined> => {
  const pendingPayments = await trx.query.premiumPayments.findMany({
    where: and(
      eq(premiumPayments.ownerAddress, transfer.senderAddress),
      eq(premiumPayments.chainId, transfer.chainId),
      eq(premiumPayments.tokenAddress, transfer.paymentToken.address),
      eq(premiumPayments.status, 'pending'),
    ),
    with: { plan: { columns: { durationDays: true, priceUsdCents: true } } },
  });

  return pendingPayments.find((payment) => isPaymentForTransfer(payment, transfer));
};

const confirmPayment = async (
  trx: DatabaseTransaction,
  payment: PendingPaymentWithPlan,
  transactionHash: Hash,
): Promise<void> => {
  const now = new Date();

  const subscriptionId = await findOrCreateSubscriptionForOwner(trx, {
    ownerAddress: payment.ownerAddress,
    planId: payment.planId,
    planVersion: payment.planVersion,
    plan: payment.plan,
    now,
  });

  await trx
    .update(premiumPayments)
    .set({ status: 'confirmed', matchedTxHash: transactionHash, confirmedAt: now, subscriptionId })
    .where(eq(premiumPayments.id, payment.id));

  await rebuildSubscriptionFromPayments(trx, subscriptionId);
};

// A payment expires only when every transfer up to its expiry was read. A transfer that arrived in time thus always
// confirms its payment, also when the scan of its chain is behind.
const expirePendingPayments = async (scanStartedAt: Date, chainIdsWithUnreadTransfers: number[]): Promise<number> => {
  const expiredPayments = await getDb()
    .update(premiumPayments)
    .set({ status: 'expired' })
    .where(
      and(
        eq(premiumPayments.status, 'pending'),
        lt(premiumPayments.expiresAt, scanStartedAt),
        notInArray(premiumPayments.chainId, chainIdsWithUnreadTransfers),
      ),
    )
    .returning({ id: premiumPayments.id });

  return expiredPayments.length;
};

const trackSubscriptionActivated = async (payment: PremiumPaymentRecord): Promise<void> => {
  const properties = {
    paymentId: payment.id,
    planId: payment.planId,
    chainId: payment.chainId,
    amountUsdCents: payment.amountUsdCents,
  };

  await trackServerEvent('Subscription Activated', payment.ownerAddress, properties, payment.id);
};
