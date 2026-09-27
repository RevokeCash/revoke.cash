import { EXECUTOR_WALLETS_FIRST_FUNDED_AT } from '@revoke.cash/core/admin/executor';
import type { ActionErrorCode } from '@revoke.cash/core/auto-revoke/actions';
import { getDb } from '@revoke.cash/core/db/client';
import { autoRevokeActions } from '@revoke.cash/core/db/schema/auto-revoke';
import { DAY } from '@revoke.cash/core/utils/time';
import { and, eq, gte, inArray, lte, sql } from 'drizzle-orm';

// Recorded executor gas spend, using the same status set as budget accounting: every action that reached the chain,
// including failed transactions, which still pay for their gas

export interface GasSpendReport {
  actionCount: number;
  spendUsd: number;
  failedActionCount: number;
  failedSpendUsd: number;
  // Days between the start of the period (or the first funding of the executor wallets) and its end (or now)
  dayCount: number;
  averageSpendPerDayUsd: number;
  chains: GasSpendChain[];
  failures: GasSpendFailure[];
}

export interface GasSpendChain {
  chainId: number;
  actionCount: number;
  spendUsd: number;
  failedActionCount: number;
  failedSpendUsd: number;
}

export interface GasSpendFailure {
  errorCode: ActionErrorCode | null;
  actionCount: number;
  spendUsd: number;
}

export const getGasSpendReport = async (from: Date, to: Date): Promise<GasSpendReport> => {
  const [chains, failures] = await Promise.all([getSpendByChain(from, to), getFailedSpendByErrorCode(from, to)]);

  const spendUsd = chains.reduce((sum, chain) => sum + chain.spendUsd, 0);
  const dayCount = getDayCount(from, to);

  return {
    actionCount: chains.reduce((sum, chain) => sum + chain.actionCount, 0),
    spendUsd,
    failedActionCount: chains.reduce((sum, chain) => sum + chain.failedActionCount, 0),
    failedSpendUsd: chains.reduce((sum, chain) => sum + chain.failedSpendUsd, 0),
    dayCount,
    averageSpendPerDayUsd: dayCount > 0 ? spendUsd / dayCount : 0,
    chains,
    failures,
  };
};

const getSpendByChain = async (from: Date, to: Date): Promise<GasSpendChain[]> => {
  const isFailed = sql`${autoRevokeActions.status} = 'failed'`;

  const rows = await getDb()
    .select({
      chainId: autoRevokeActions.chainId,
      actionCount: sql<number>`count(*)::int`,
      spendUsd: sql<number>`coalesce(sum(${autoRevokeActions.costUsd}), 0)::float`,
      failedActionCount: sql<number>`(count(*) filter (where ${isFailed}))::int`,
      failedSpendUsd: sql<number>`coalesce(sum(${autoRevokeActions.costUsd}) filter (where ${isFailed}), 0)::float`,
    })
    .from(autoRevokeActions)
    .where(
      and(
        inArray(autoRevokeActions.status, ['submitted', 'succeeded', 'failed']),
        gte(autoRevokeActions.submittedAt, from),
        lte(autoRevokeActions.submittedAt, to),
      ),
    )
    .groupBy(autoRevokeActions.chainId);

  return rows.sort((a, b) => b.spendUsd - a.spendUsd);
};

const getFailedSpendByErrorCode = async (from: Date, to: Date): Promise<GasSpendFailure[]> => {
  const rows = await getDb()
    .select({
      errorCode: autoRevokeActions.errorCode,
      actionCount: sql<number>`count(*)::int`,
      spendUsd: sql<number>`coalesce(sum(${autoRevokeActions.costUsd}), 0)::float`,
    })
    .from(autoRevokeActions)
    .where(
      and(
        eq(autoRevokeActions.status, 'failed'),
        gte(autoRevokeActions.submittedAt, from),
        lte(autoRevokeActions.submittedAt, to),
      ),
    )
    .groupBy(autoRevokeActions.errorCode);

  return rows.sort((a, b) => b.spendUsd - a.spendUsd);
};

const getDayCount = (from: Date, to: Date): number => {
  const periodStart = Math.max(from.getTime(), EXECUTOR_WALLETS_FIRST_FUNDED_AT.getTime());
  const periodEnd = Math.min(to.getTime(), Date.now());
  return Math.max(0, (periodEnd - periodStart) / DAY);
};
