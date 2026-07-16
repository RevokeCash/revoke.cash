import type { ActionStatus } from '@revoke.cash/core/auto-revoke/actions';
import { AUTO_REVOKE_SUPPORTED_CHAINS } from '@revoke.cash/core/auto-revoke/config';
import { type DatabaseWriter, getDb } from '@revoke.cash/core/db/client';
import { autoRevokeActions } from '@revoke.cash/core/db/schema/auto-revoke';
import { indexerAllowanceState, indexerEventsState } from '@revoke.cash/core/db/schema/indexer';
import { premiumPayments } from '@revoke.cash/core/db/schema/premium';
import { getPendingRefundRequestCount } from '@revoke.cash/core/premium/refunds';
import { activeSubscriptionsQuery } from '@revoke.cash/core/premium/subscriptions';
import { MINUTE } from '@revoke.cash/core/utils/time';
import { and, asc, count, desc, eq, exists, gt, inArray, isNotNull, isNull, lt, or, sql } from 'drizzle-orm';
import type { Address } from 'viem';

export interface ActionStatusCount {
  status: ActionStatus;
  count: number;
}

export interface AdminHealth {
  actionCounts: ActionStatusCount[];
  // Addresses with recomputed allowances that auto-revoke has not evaluated yet
  evaluationBacklogCount: number;
  indexerDisabledCount: number;
  indexerFailingCount: number;
  // Pending payments past their quote expiry that the reconcile cron has not yet touched
  pendingPaymentsPastExpiryCount: number;
  // Refund requests (EU right of withdrawal) awaiting manual processing; refunds are due within 14 days
  pendingRefundRequestCount: number;
}

// Pending payments are expired by the reconcile cron (every 5 minutes), so anything pending
// well past its expiry indicates a reconciliation backlog or a broken cron.
const PENDING_PAYMENT_GRACE_MS = 15 * MINUTE;

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

export type IndexerProblemKind = 'disabled' | 'failing';

// Matches the tile counts exactly: disabled rows are excluded from the failing tile
const indexerProblemConditions = (kind: IndexerProblemKind) =>
  kind === 'disabled'
    ? isNotNull(indexerEventsState.disabledAt)
    : and(gt(indexerEventsState.consecutiveFailures, 0), isNull(indexerEventsState.disabledAt));

const stuckPendingPaymentConditions = () =>
  and(
    eq(premiumPayments.status, 'pending'),
    lt(premiumPayments.expiresAt, new Date(Date.now() - PENDING_PAYMENT_GRACE_MS)),
  );

export const getAdminHealth = async (): Promise<AdminHealth> => {
  const db = getDb();

  const [actionRows, [evaluationRow], [indexerDisabledRow], [indexerFailingRow], [pendingPaymentsRow], refunds] =
    await Promise.all([
      db
        .select({ status: autoRevokeActions.status, count: sql<number>`count(*)::int` })
        .from(autoRevokeActions)
        .groupBy(autoRevokeActions.status),
      db.select({ count: count() }).from(indexerAllowanceState).where(evaluationBacklogConditions(db)),
      db.select({ count: count() }).from(indexerEventsState).where(indexerProblemConditions('disabled')),
      db.select({ count: count() }).from(indexerEventsState).where(indexerProblemConditions('failing')),
      db.select({ count: count() }).from(premiumPayments).where(stuckPendingPaymentConditions()),
      getPendingRefundRequestCount(),
    ]);

  return {
    actionCounts: actionRows,
    evaluationBacklogCount: evaluationRow.count,
    indexerDisabledCount: indexerDisabledRow.count,
    indexerFailingCount: indexerFailingRow.count,
    pendingPaymentsPastExpiryCount: pendingPaymentsRow.count,
    pendingRefundRequestCount: refunds,
  };
};

const DETAIL_ROW_LIMIT = 50;

export interface EvaluationBacklogRow {
  address: Address;
  chainId: number;
  computedAt: string;
  lastEvaluatedAt: string | null;
}

export interface EvaluationBacklogDetails {
  rows: EvaluationBacklogRow[];
  totalCount: number;
}

export const getEvaluationBacklogRows = async (): Promise<EvaluationBacklogDetails> => {
  const db = getDb();

  const [rows, [countRow]] = await Promise.all([
    db
      .select({
        address: indexerAllowanceState.address,
        chainId: indexerAllowanceState.chainId,
        computedAt: indexerAllowanceState.computedAt,
        lastEvaluatedAt: indexerAllowanceState.lastEvaluatedAt,
      })
      .from(indexerAllowanceState)
      .where(evaluationBacklogConditions(db))
      .orderBy(asc(indexerAllowanceState.computedAt))
      .limit(DETAIL_ROW_LIMIT),
    db.select({ count: count() }).from(indexerAllowanceState).where(evaluationBacklogConditions(db)),
  ]);

  return {
    rows: rows.map((row) => ({
      ...row,
      // computedAt is non-null per the backlog conditions
      computedAt: row.computedAt?.toISOString() ?? '',
      lastEvaluatedAt: row.lastEvaluatedAt?.toISOString() ?? null,
    })),
    totalCount: countRow.count,
  };
};

export interface IndexerProblemRow {
  address: Address;
  chainId: number;
  consecutiveFailures: number;
  lastError: string | null;
  disabledAt: string | null;
  lastScanAt: string | null;
  nextRunAt: string | null;
}

export interface IndexerProblemDetails {
  rows: IndexerProblemRow[];
  totalCount: number;
}

export const getIndexerProblemRows = async (kind: IndexerProblemKind): Promise<IndexerProblemDetails> => {
  const db = getDb();

  const [rows, [countRow]] = await Promise.all([
    db
      .select({
        address: indexerEventsState.address,
        chainId: indexerEventsState.chainId,
        consecutiveFailures: indexerEventsState.consecutiveFailures,
        lastError: indexerEventsState.lastError,
        disabledAt: indexerEventsState.disabledAt,
        lastScanAt: indexerEventsState.lastScanAt,
        nextRunAt: indexerEventsState.nextRunAt,
      })
      .from(indexerEventsState)
      .where(indexerProblemConditions(kind))
      .orderBy(desc(indexerEventsState.consecutiveFailures))
      .limit(DETAIL_ROW_LIMIT),
    db.select({ count: count() }).from(indexerEventsState).where(indexerProblemConditions(kind)),
  ]);

  return {
    rows: rows.map((row) => ({
      ...row,
      disabledAt: row.disabledAt?.toISOString() ?? null,
      lastScanAt: row.lastScanAt?.toISOString() ?? null,
      nextRunAt: row.nextRunAt?.toISOString() ?? null,
    })),
    totalCount: countRow.count,
  };
};

export interface StuckPendingPaymentRow {
  id: string;
  ownerAddress: Address;
  subscriptionId: string | null;
  chainId: number;
  amountUsdCents: number;
  createdAt: string;
  expiresAt: string;
}

export interface StuckPendingPaymentDetails {
  rows: StuckPendingPaymentRow[];
  totalCount: number;
}

export const getStuckPendingPaymentRows = async (): Promise<StuckPendingPaymentDetails> => {
  const db = getDb();

  // Evaluate the cutoff once so the rows and count use the same predicate
  const conditions = stuckPendingPaymentConditions();

  const [rows, [countRow]] = await Promise.all([
    db
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
      .where(conditions)
      .orderBy(asc(premiumPayments.expiresAt))
      .limit(DETAIL_ROW_LIMIT),
    db.select({ count: count() }).from(premiumPayments).where(conditions),
  ]);

  return {
    rows: rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      expiresAt: row.expiresAt.toISOString(),
    })),
    totalCount: countRow.count,
  };
};
