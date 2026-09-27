import { AUTO_REVOKE_MONTHLY_GAS_BUDGET_USD } from '@revoke.cash/core/auto-revoke/config';
import { type BudgetPeriod, getUtcMonthPeriod } from '@revoke.cash/core/auto-revoke/execution/budget';
import { getDb } from '@revoke.cash/core/db/client';
import { autoRevokeActions } from '@revoke.cash/core/db/schema/auto-revoke';
import { premiumPlans, premiumSubscriptions } from '@revoke.cash/core/db/schema/premium';
import { and, eq, inArray, isNotNull, sql } from 'drizzle-orm';
import type { Address } from 'viem';

// Monthly gas budget usage of Ultimate subscriptions. The budget resets every UTC month, so usage is measured per
// subscription per month, using the same status set as budget accounting.

export interface GasBudgetReport {
  // Average usage per subscription-month, so every month of every subscription weighs the same (a subscription with
  // three months counts three times); null when no subscription used gas in the period
  averageMonthlyUsageUsd: number | null;
  averagedSubscriptionCount: number;
  // Average current-month usage of the active subscriptions that ever used gas; null when there are none
  currentMonthAverageUsageUsd: number | null;
  currentMonthAveragedSubscriptionCount: number;
  reachedBudgetCount: number;
  blockedActionCount: number;
  awaitingCheapGasActionCount: number;
  // Active subscriptions only, most current-month usage first
  subscriptions: GasBudgetSubscription[];
}

export interface GasBudgetSubscription {
  id: string;
  ownerAddress: Address;
  planName: string;
  endsAt: string;
  currentMonthUsageUsd: number;
  // Over the months in the period since the subscription first used gas, including the running month; null when there
  // are none
  averageMonthlyUsageUsd: number | null;
  averagedMonthCount: number;
}

interface UltimateSubscription {
  id: string;
  ownerAddress: Address;
  planName: string;
  startsAt: Date;
  endsAt: Date;
}

// Month keys are 'YYYY-MM' in UTC
type UsageByMonth = Map<string, number>;

export const getGasBudgetReport = async (from: Date, to: Date): Promise<GasBudgetReport> => {
  const [ultimateSubscriptions, usageBySubscription, parkedActionCounts] = await Promise.all([
    getUltimateSubscriptions(),
    getUsageBySubscription(),
    getParkedActionCounts(),
  ]);

  const periodMonths = getMonthsInPeriod(from, to);
  const currentMonthKey = toMonthKey(getUtcMonthPeriod().start);

  const subscriptions = ultimateSubscriptions.map((subscription) => {
    const usageByMonth = usageBySubscription.get(subscription.id) ?? new Map();
    const averagedMonths = getAveragedMonths(subscription, usageByMonth, periodMonths);
    const averagedUsageUsd = averagedMonths.reduce(
      (sum, month) => sum + (usageByMonth.get(toMonthKey(month.start)) ?? 0),
      0,
    );

    return {
      ...subscription,
      hasUsedGas: usageByMonth.size > 0,
      currentMonthUsageUsd: usageByMonth.get(currentMonthKey) ?? 0,
      averageMonthlyUsageUsd: averagedMonths.length > 0 ? averagedUsageUsd / averagedMonths.length : null,
      averagedUsageUsd,
      averagedMonthCount: averagedMonths.length,
    };
  });

  const averagedSubscriptions = subscriptions.filter((subscription) => subscription.averagedMonthCount > 0);
  const averagedUsageUsd = averagedSubscriptions.reduce((sum, subscription) => sum + subscription.averagedUsageUsd, 0);
  const averagedSubscriptionMonthCount = averagedSubscriptions.reduce(
    (sum, subscription) => sum + subscription.averagedMonthCount,
    0,
  );
  const activeSubscriptions = subscriptions.filter((subscription) => isActive(subscription));
  const currentMonthUsages = activeSubscriptions
    .filter((subscription) => subscription.hasUsedGas)
    .map((subscription) => subscription.currentMonthUsageUsd);

  return {
    averageMonthlyUsageUsd:
      averagedSubscriptionMonthCount > 0 ? averagedUsageUsd / averagedSubscriptionMonthCount : null,
    averagedSubscriptionCount: averagedSubscriptions.length,
    currentMonthAverageUsageUsd: average(currentMonthUsages),
    currentMonthAveragedSubscriptionCount: currentMonthUsages.length,
    reachedBudgetCount: activeSubscriptions.filter(
      (subscription) => subscription.currentMonthUsageUsd >= AUTO_REVOKE_MONTHLY_GAS_BUDGET_USD,
    ).length,
    ...parkedActionCounts,
    subscriptions: activeSubscriptions
      .sort((a, b) => b.currentMonthUsageUsd - a.currentMonthUsageUsd)
      .map((subscription) => ({
        id: subscription.id,
        ownerAddress: subscription.ownerAddress,
        planName: subscription.planName,
        endsAt: subscription.endsAt.toISOString(),
        currentMonthUsageUsd: subscription.currentMonthUsageUsd,
        averageMonthlyUsageUsd: subscription.averageMonthlyUsageUsd,
        averagedMonthCount: subscription.averagedMonthCount,
      })),
  };
};

// Months count from the subscription's first gas use, so subscriptions that never used gas are left out entirely.
// Months after that without gas use count as zero usage, as long as the subscription was active in them.
const getAveragedMonths = (
  subscription: UltimateSubscription,
  usageByMonth: UsageByMonth,
  periodMonths: BudgetPeriod[],
): BudgetPeriod[] => {
  const [firstUsageMonthKey] = [...usageByMonth.keys()].sort();
  if (!firstUsageMonthKey) return [];

  return periodMonths.filter(
    (month) =>
      toMonthKey(month.start) >= firstUsageMonthKey &&
      subscription.startsAt < month.end &&
      subscription.endsAt > month.start,
  );
};

// UTC months that lie fully inside the period. The running month counts too (with its usage so far) when the period
// reaches today, so a month that is not over yet is treated as if it ended now.
const getMonthsInPeriod = (from: Date, to: Date): BudgetPeriod[] => {
  const now = Date.now();
  const periodEnd = to.getTime() + 1;
  const lastDate = new Date(Math.min(periodEnd, now));
  const monthCount =
    (lastDate.getUTCFullYear() - from.getUTCFullYear()) * 12 + (lastDate.getUTCMonth() - from.getUTCMonth()) + 1;

  return Array.from({ length: Math.max(0, monthCount) }, (_, index) =>
    getUtcMonthPeriod(new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + index, 1))),
  ).filter((month) => month.start >= from && Math.min(month.end.getTime(), now) <= periodEnd);
};

const isActive = (subscription: UltimateSubscription): boolean => {
  const now = new Date();
  return subscription.startsAt <= now && subscription.endsAt > now;
};

const toMonthKey = (date: Date): string => date.toISOString().slice(0, 7);

const average = (values: number[]): number | null => {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const getUltimateSubscriptions = async (): Promise<UltimateSubscription[]> => {
  return getDb()
    .select({
      id: premiumSubscriptions.id,
      ownerAddress: premiumSubscriptions.ownerAddress,
      planName: premiumPlans.name,
      startsAt: premiumSubscriptions.startsAt,
      endsAt: premiumSubscriptions.endsAt,
    })
    .from(premiumSubscriptions)
    .innerJoin(
      premiumPlans,
      and(eq(premiumPlans.id, premiumSubscriptions.planId), eq(premiumPlans.version, premiumSubscriptions.planVersion)),
    )
    .where(eq(premiumPlans.tier, 'ultimate'));
};

const getUsageBySubscription = async (): Promise<Map<string, UsageByMonth>> => {
  const monthKey = sql<string>`to_char(${autoRevokeActions.submittedAt} at time zone 'UTC', 'YYYY-MM')`;

  const rows = await getDb()
    .select({
      subscriptionId: autoRevokeActions.billedSubscriptionId,
      monthKey,
      usageUsd: sql<number>`coalesce(sum(${autoRevokeActions.costUsd}), 0)::float`,
    })
    .from(autoRevokeActions)
    .where(
      and(
        inArray(autoRevokeActions.status, ['submitted', 'succeeded', 'failed']),
        isNotNull(autoRevokeActions.billedSubscriptionId),
        isNotNull(autoRevokeActions.submittedAt),
      ),
    )
    .groupBy(autoRevokeActions.billedSubscriptionId, monthKey);

  const usageBySubscription = new Map<string, UsageByMonth>();
  for (const row of rows) {
    const usageByMonth = usageBySubscription.get(row.subscriptionId!) ?? new Map();
    usageByMonth.set(row.monthKey, row.usageUsd);
    usageBySubscription.set(row.subscriptionId!, usageByMonth);
  }

  return usageBySubscription;
};

// Actions that are waiting because of cost: blocked by the monthly budget, or waiting until gas is cheap enough for
// the soft cap or the per-action cap
const getParkedActionCounts = async (): Promise<
  Pick<GasBudgetReport, 'blockedActionCount' | 'awaitingCheapGasActionCount'>
> => {
  const [row] = await getDb()
    .select({
      blockedActionCount: sql<number>`(count(*) filter (where ${autoRevokeActions.status} = 'blocked_budget'))::int`,
      awaitingCheapGasActionCount: sql<number>`(count(*) filter (where ${autoRevokeActions.status} = 'queued' and ${autoRevokeActions.errorCode} in ('awaiting_cheap_gas', 'per_action_cap')))::int`,
    })
    .from(autoRevokeActions)
    .where(inArray(autoRevokeActions.status, ['queued', 'blocked_budget']));

  return row;
};
