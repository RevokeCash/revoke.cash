import { type DatabaseTransaction, type DatabaseWriter, getDb } from '@revoke.cash/core/db/client';
import { autoRevokeActions } from '@revoke.cash/core/db/schema/auto-revoke';
import { premiumPlans, premiumSubscriptionAddresses, premiumSubscriptions } from '@revoke.cash/core/db/schema/premium';
import { HOUR } from '@revoke.cash/core/utils/time';
import { and, asc, eq, gt, gte, inArray, lt, lte, sql } from 'drizzle-orm';
import type { Address } from 'viem';

const MONTHLY_BUDGET_USD = 5;
const MAX_ACTION_COST_USD = 2;
const ACTION_COST_RETRY_DELAY_MS = 1 * HOUR;

export type BudgetDecision =
  | { allowed: true }
  | { allowed: false; reason: 'per_action_cap' | 'monthly_budget'; nextRetryAt: Date };

export interface MonthlyBudget {
  budgetUsd: number;
  committedUsd: number;
  remainingUsd: number;
  maxActionCostUsd: number;
  period: BudgetPeriod;
}

export interface BudgetPeriod {
  start: Date;
  end: Date;
}

export const findBillingSubscriptionIds = async (writer: DatabaseWriter, address: Address): Promise<string[]> => {
  const subscriptions = await writer
    .select({ id: premiumSubscriptions.id })
    .from(premiumSubscriptionAddresses)
    .innerJoin(premiumSubscriptions, eq(premiumSubscriptions.id, premiumSubscriptionAddresses.subscriptionId))
    .innerJoin(
      premiumPlans,
      and(eq(premiumPlans.id, premiumSubscriptions.planId), eq(premiumPlans.version, premiumSubscriptions.planVersion)),
    )
    .where(
      and(
        eq(premiumSubscriptionAddresses.address, address),
        eq(premiumPlans.tier, 'ultimate'),
        lte(premiumSubscriptions.startsAt, sql`now()`),
        gt(premiumSubscriptions.endsAt, sql`now()`),
      ),
    )
    .orderBy(asc(premiumSubscriptions.startsAt), asc(premiumSubscriptions.id));

  return subscriptions.map((subscription) => subscription.id);
};

export const checkActionCost = (estimatedCostUsd: number): BudgetDecision => {
  if (estimatedCostUsd > MAX_ACTION_COST_USD) {
    return { allowed: false, reason: 'per_action_cap', nextRetryAt: new Date(Date.now() + ACTION_COST_RETRY_DELAY_MS) };
  }

  return { allowed: true };
};

export const getUtcMonthPeriod = (date = new Date()): BudgetPeriod => {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
  return { start, end };
};

export const getNextBudgetRetryAt = (date = new Date()): Date => {
  return getUtcMonthPeriod(date).end;
};

export const getMonthlyBudget = async (
  subscriptionId: string,
  writer: DatabaseWriter = getDb(),
): Promise<MonthlyBudget> => {
  const period = getUtcMonthPeriod();

  const budgetUsd = MONTHLY_BUDGET_USD;
  const committedUsd = await getCommittedBudgetUsd(writer, subscriptionId, period);
  const remainingUsd = Math.max(0, budgetUsd - committedUsd);

  return { budgetUsd, committedUsd, remainingUsd, maxActionCostUsd: MAX_ACTION_COST_USD, period };
};

export const lockAndCheckBudget = async (trx: DatabaseTransaction, subscriptionId: string): Promise<BudgetDecision> => {
  await trx.execute(
    sql`SELECT pg_advisory_xact_lock(hashtextextended(${`auto_revoke_budget:${subscriptionId}`}, 0::bigint))`,
  );

  const monthlyBudget = await getMonthlyBudget(subscriptionId, trx);
  if (monthlyBudget.remainingUsd <= 0) {
    return { allowed: false, reason: 'monthly_budget', nextRetryAt: getNextBudgetRetryAt() };
  }

  return { allowed: true };
};

const getCommittedBudgetUsd = async (
  writer: DatabaseWriter,
  subscriptionId: string,
  period: BudgetPeriod,
): Promise<number> => {
  const [row] = await writer
    .select({ committedUsd: sql<string>`coalesce(sum(${autoRevokeActions.costUsd}), 0)` })
    .from(autoRevokeActions)
    .where(
      and(
        eq(autoRevokeActions.billedSubscriptionId, subscriptionId),
        inArray(autoRevokeActions.status, ['submitted', 'succeeded', 'failed']),
        gte(autoRevokeActions.submittedAt, period.start),
        lt(autoRevokeActions.submittedAt, period.end),
      ),
    );

  return Number(row.committedUsd);
};
