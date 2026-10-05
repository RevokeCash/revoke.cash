import { notUpgradedPermissionConditions, stuckSubmittedConditions } from '@revoke.cash/core/admin/executor';
import type { ActionStatus } from '@revoke.cash/core/auto-revoke/actions';
import { AUTO_REVOKE_SUPPORTED_CHAINS } from '@revoke.cash/core/auto-revoke/config';
import { unverifiedFeePaymentConditions } from '@revoke.cash/core/batch-revokes/verify-fee-payments';
import { ORDERED_CHAINS } from '@revoke.cash/core/chains';
import { type DatabaseWriter, getDb } from '@revoke.cash/core/db/client';
import { autoRevokeActions, autoRevokePermissions } from '@revoke.cash/core/db/schema/auto-revoke';
import { batchRevokes } from '@revoke.cash/core/db/schema/batch-revokes';
import { indexerAllowanceState, indexerEventsState } from '@revoke.cash/core/db/schema/indexer';
import { premiumPayments, premiumTransferScanCursors } from '@revoke.cash/core/db/schema/premium';
import { FAIL_FAST_FAILURE_THRESHOLD } from '@revoke.cash/core/indexer/cache-state';
import { PREMIUM_PAYMENT_CHAIN_IDS } from '@revoke.cash/core/premium/payment-config';
import { getPendingRefundRequestCount } from '@revoke.cash/core/premium/refunds';
import { activeSubscriptionsQuery } from '@revoke.cash/core/premium/subscriptions';
import { DAY, MINUTE } from '@revoke.cash/core/utils/time';
import {
  and,
  asc,
  count,
  desc,
  eq,
  exists,
  gte,
  inArray,
  isNotNull,
  isNull,
  lt,
  lte,
  min,
  notInArray,
  or,
  sql,
} from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { type Address, getAddress } from 'viem';

export interface ActionStatusCount {
  status: ActionStatus;
  count: number;
}

export interface PaymentScanCursor {
  chainId: number;
  // null when the incoming transfer scan never succeeded on this chain
  updatedAt: string | null;
}

export interface AdminHealth {
  // Open actions of any age, plus succeeded, failed and skipped actions completed in the last 7 days
  actionCounts: ActionStatusCount[];
  // Addresses with recomputed allowances that auto-revoke has not evaluated yet
  evaluationBacklogCount: number;
  evaluationBacklogOldestComputedAt: string | null;
  // next_run_at of the longest-waiting events scan that the scheduler should already have enqueued; null when
  // nothing is due
  oldestDueIndexerRunAt: string | null;
  // The payment chain whose incoming transfer scan last succeeded the longest ago
  oldestPaymentScanCursor: PaymentScanCursor;
  stuckSubmittedCount: number;
  // Live permissions of Ultimate wallets that cannot execute until the wallet upgrades, one per address and chain
  notUpgradedWalletCount: number;
  // Failing events scan and allowance recompute rows of subscribed addresses
  indexerFailingCount: number;
  // Pending payments past their quote expiry that the reconcile cron has not yet touched
  pendingPaymentsPastExpiryCount: number;
  // Refund requests (EU right of withdrawal) awaiting manual processing; refunds are due within 14 days
  pendingRefundRequestCount: number;
  // Paid batch revokes whose fee transaction the verification cron has not yet confirmed or rejected
  feeVerificationPendingCount: number;
  // Paid batch revokes reported in the last 7 days whose fee transaction failed verification
  feeVerificationFailedCount: number;
}

// Pending payments are expired by the reconcile cron (every 5 minutes), so anything pending
// well past its expiry indicates a reconciliation backlog or a broken cron.
const PENDING_PAYMENT_GRACE_MS = 15 * MINUTE;

// Completed actions only count within this window, so one past failure does not keep the failed chip red forever
const RECENT_ACTION_WINDOW_MS = 7 * DAY;
const COMPLETED_ACTION_STATUSES: ActionStatus[] = ['succeeded', 'failed', 'skipped'];

// Shared predicates so the drill-down lists always match the counts above them
const evaluationBacklogConditions = (db: DatabaseWriter) =>
  and(
    inArray(indexerAllowanceState.chainId, [...AUTO_REVOKE_SUPPORTED_CHAINS]),
    isNotNull(indexerAllowanceState.computedAt),
    or(
      isNull(indexerAllowanceState.lastEvaluatedAt),
      lt(indexerAllowanceState.lastEvaluatedAt, indexerAllowanceState.computedAt),
    ),
    exists(activeSubscriptionsQuery(db, indexerAllowanceState.address, 'ultimate')),
  );

// Same predicate as SubscribersService.findReadyToIndex, so web refreshes of one address cannot hide a stopped scheduler
const dueIndexerScanConditions = (db: DatabaseWriter) =>
  and(
    lte(indexerEventsState.nextRunAt, sql`now()`),
    isNull(indexerEventsState.disabledAt),
    inArray(indexerEventsState.chainId, [...ORDERED_CHAINS]),
    exists(activeSubscriptionsQuery(db, indexerEventsState.address)),
  );

export type IndexingStage = 'events' | 'allowances';

// Uses the threshold at which users see ChainUnresponsiveError. Rows the scheduler no longer runs (removed chain,
// no active subscription) never clear, so they are left out.
const indexingFailingConditions = (
  db: DatabaseWriter,
  table: typeof indexerEventsState | typeof indexerAllowanceState,
) =>
  and(
    gte(table.consecutiveFailures, FAIL_FAST_FAILURE_THRESHOLD),
    inArray(table.chainId, [...ORDERED_CHAINS]),
    exists(activeSubscriptionsQuery(db, table.address)),
  );

export type FeeVerificationProblemKind = 'pending' | 'failed';

// There is no failed-at column, so failures are counted by report time
const FEE_VERIFICATION_FAILED_WINDOW = 7 * DAY;

const feeVerificationProblemConditions = (kind: FeeVerificationProblemKind) =>
  kind === 'pending'
    ? unverifiedFeePaymentConditions()
    : and(
        isNotNull(batchRevokes.feeVerificationError),
        gte(batchRevokes.timestamp, new Date(Date.now() - FEE_VERIFICATION_FAILED_WINDOW)),
      );

const stuckPendingPaymentConditions = () =>
  and(
    eq(premiumPayments.status, 'pending'),
    lt(premiumPayments.expiresAt, new Date(Date.now() - PENDING_PAYMENT_GRACE_MS)),
  );

export const getAdminHealth = async (): Promise<AdminHealth> => {
  const db = getDb();

  const [
    actionRows,
    [evaluationRow],
    [indexerScanRow],
    paymentScanCursorRows,
    [stuckSubmittedRow],
    [notUpgradedWalletRow],
    [indexerEventsFailingRow],
    [indexerAllowancesFailingRow],
    [pendingPaymentsRow],
    refunds,
    [feeVerificationPendingRow],
    [feeVerificationFailedRow],
  ] = await Promise.all([
    db
      .select({ status: autoRevokeActions.status, count: sql<number>`count(*)::int` })
      .from(autoRevokeActions)
      .where(
        or(
          notInArray(autoRevokeActions.status, COMPLETED_ACTION_STATUSES),
          gte(autoRevokeActions.completedAt, new Date(Date.now() - RECENT_ACTION_WINDOW_MS)),
        ),
      )
      .groupBy(autoRevokeActions.status),
    db
      .select({ count: count(), oldestComputedAt: min(indexerAllowanceState.computedAt) })
      .from(indexerAllowanceState)
      .where(evaluationBacklogConditions(db)),
    db
      .select({ oldestNextRunAt: min(indexerEventsState.nextRunAt) })
      .from(indexerEventsState)
      .where(dueIndexerScanConditions(db)),
    db
      .select({ chainId: premiumTransferScanCursors.chainId, updatedAt: premiumTransferScanCursors.updatedAt })
      .from(premiumTransferScanCursors)
      .where(inArray(premiumTransferScanCursors.chainId, [...PREMIUM_PAYMENT_CHAIN_IDS])),
    db.select({ count: count() }).from(autoRevokeActions).where(stuckSubmittedConditions()),
    db.select({ count: count() }).from(autoRevokePermissions).where(notUpgradedPermissionConditions(db)),
    db.select({ count: count() }).from(indexerEventsState).where(indexingFailingConditions(db, indexerEventsState)),
    db
      .select({ count: count() })
      .from(indexerAllowanceState)
      .where(indexingFailingConditions(db, indexerAllowanceState)),
    db.select({ count: count() }).from(premiumPayments).where(stuckPendingPaymentConditions()),
    getPendingRefundRequestCount(),
    db.select({ count: count() }).from(batchRevokes).where(feeVerificationProblemConditions('pending')),
    db.select({ count: count() }).from(batchRevokes).where(feeVerificationProblemConditions('failed')),
  ]);

  // A payment chain without a cursor row has never been scanned successfully, so it sorts first
  const paymentScanCursors = PREMIUM_PAYMENT_CHAIN_IDS.map((chainId) => ({
    chainId,
    updatedAt: paymentScanCursorRows.find((row) => row.chainId === chainId)?.updatedAt ?? null,
  }));
  const [oldestPaymentScanCursor] = paymentScanCursors.sort(
    (left, right) => (left.updatedAt?.getTime() ?? 0) - (right.updatedAt?.getTime() ?? 0),
  );

  return {
    actionCounts: actionRows,
    evaluationBacklogCount: evaluationRow.count,
    evaluationBacklogOldestComputedAt: evaluationRow.oldestComputedAt?.toISOString() ?? null,
    oldestDueIndexerRunAt: indexerScanRow.oldestNextRunAt?.toISOString() ?? null,
    oldestPaymentScanCursor: {
      chainId: oldestPaymentScanCursor.chainId,
      updatedAt: oldestPaymentScanCursor.updatedAt?.toISOString() ?? null,
    },
    stuckSubmittedCount: stuckSubmittedRow.count,
    notUpgradedWalletCount: notUpgradedWalletRow.count,
    indexerFailingCount: indexerEventsFailingRow.count + indexerAllowancesFailingRow.count,
    pendingPaymentsPastExpiryCount: pendingPaymentsRow.count,
    pendingRefundRequestCount: refunds,
    feeVerificationPendingCount: feeVerificationPendingRow.count,
    feeVerificationFailedCount: feeVerificationFailedRow.count,
  };
};

export interface EvaluationBacklogRow {
  address: Address;
  chainId: number;
  computedAt: string;
  lastEvaluatedAt: string | null;
}

export const getEvaluationBacklogRows = async (): Promise<EvaluationBacklogRow[]> => {
  const db = getDb();

  const rows = await db
    .select({
      address: indexerAllowanceState.address,
      chainId: indexerAllowanceState.chainId,
      computedAt: indexerAllowanceState.computedAt,
      lastEvaluatedAt: indexerAllowanceState.lastEvaluatedAt,
    })
    .from(indexerAllowanceState)
    .where(evaluationBacklogConditions(db))
    .orderBy(asc(indexerAllowanceState.computedAt));

  return rows.map((row) => ({
    ...row,
    // computedAt is non-null per the backlog conditions
    computedAt: row.computedAt?.toISOString() ?? '',
    lastEvaluatedAt: row.lastEvaluatedAt?.toISOString() ?? null,
  }));
};

export interface DueIndexerScanRow {
  address: Address;
  chainId: number;
  nextRunAt: string;
  lastScanAt: string | null;
  consecutiveFailures: number;
  lastError: string | null;
}

export const getDueIndexerScanRows = async (): Promise<DueIndexerScanRow[]> => {
  const db = getDb();

  const rows = await db
    .select({
      address: indexerEventsState.address,
      chainId: indexerEventsState.chainId,
      nextRunAt: indexerEventsState.nextRunAt,
      lastScanAt: indexerEventsState.lastScanAt,
      consecutiveFailures: indexerEventsState.consecutiveFailures,
      lastError: indexerEventsState.lastError,
    })
    .from(indexerEventsState)
    .where(dueIndexerScanConditions(db))
    .orderBy(asc(indexerEventsState.nextRunAt));

  return rows.map((row) => ({
    ...row,
    nextRunAt: row.nextRunAt.toISOString(),
    lastScanAt: row.lastScanAt?.toISOString() ?? null,
  }));
};

export interface IndexerProblemGroup {
  stage: IndexingStage;
  chainId: number;
  lastError: string | null;
  addresses: Address[];
}

// Grouped by chain and error, so a chain-wide RPC problem shows as one row instead of one row per address
export const getIndexerProblemGroups = async (): Promise<IndexerProblemGroup[]> => {
  const db = getDb();

  const [eventsGroups, allowancesGroups] = await Promise.all([
    db
      .select({
        chainId: indexerEventsState.chainId,
        lastError: indexerEventsState.lastError,
        addresses: aggregateAddresses(indexerEventsState.address),
      })
      .from(indexerEventsState)
      .where(indexingFailingConditions(db, indexerEventsState))
      .groupBy(indexerEventsState.chainId, indexerEventsState.lastError),
    db
      .select({
        chainId: indexerAllowanceState.chainId,
        lastError: indexerAllowanceState.lastError,
        addresses: aggregateAddresses(indexerAllowanceState.address),
      })
      .from(indexerAllowanceState)
      .where(indexingFailingConditions(db, indexerAllowanceState))
      .groupBy(indexerAllowanceState.chainId, indexerAllowanceState.lastError),
  ]);

  const groups: IndexerProblemGroup[] = [
    ...eventsGroups.map((group) => ({ stage: 'events' as const, ...group })),
    ...allowancesGroups.map((group) => ({ stage: 'allowances' as const, ...group })),
  ];

  return groups.sort((left, right) => right.addresses.length - left.addresses.length);
};

// array_agg bypasses the column's own mapping, so the lowercase addresses are checksummed here
const aggregateAddresses = (column: AnyPgColumn) =>
  sql<string[]>`array_agg(${column} order by ${column})`.mapWith((addresses: string[]) =>
    addresses.map((address) => getAddress(address)),
  );

export interface StuckPendingPaymentRow {
  id: string;
  ownerAddress: Address;
  subscriptionId: string | null;
  chainId: number;
  amountUsdCents: number;
  createdAt: string;
  expiresAt: string;
}

export const getStuckPendingPaymentRows = async (): Promise<StuckPendingPaymentRow[]> => {
  const db = getDb();

  const rows = await db
    .select({
      id: premiumPayments.id,
      ownerAddress: premiumPayments.ownerAddress,
      subscriptionId: premiumPayments.subscriptionId,
      chainId: premiumPayments.chainId,
      amountUsdCents: premiumPayments.amountUsdCents,
      createdAt: premiumPayments.createdAt,
      expiresAt: premiumPayments.expiresAt,
    })
    .from(premiumPayments)
    .where(stuckPendingPaymentConditions())
    .orderBy(asc(premiumPayments.expiresAt));

  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
  }));
};

export interface FeeVerificationProblemRow {
  id: number;
  chainId: number;
  userAddress: Address | null;
  feeTransactionHash: string | null;
  feeUsdCents: number;
  timestamp: string;
  feeVerificationError: string | null;
}

export const getFeeVerificationProblemRows = async (
  kind: FeeVerificationProblemKind,
): Promise<FeeVerificationProblemRow[]> => {
  const db = getDb();

  const rows = await db
    .select({
      id: batchRevokes.id,
      chainId: batchRevokes.chainId,
      userAddress: batchRevokes.userAddress,
      feeTransactionHash: batchRevokes.feeTransactionHash,
      feeUsdCents: batchRevokes.feeUsdCents,
      timestamp: batchRevokes.timestamp,
      feeVerificationError: batchRevokes.feeVerificationError,
    })
    .from(batchRevokes)
    .where(feeVerificationProblemConditions(kind))
    .orderBy(kind === 'pending' ? asc(batchRevokes.timestamp) : desc(batchRevokes.timestamp));

  return rows.map((row) => ({ ...row, timestamp: row.timestamp.toISOString() }));
};
