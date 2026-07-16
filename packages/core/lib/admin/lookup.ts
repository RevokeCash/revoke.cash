import { getDb } from '@revoke.cash/core/db/client';
import { indexerAllowanceState, indexerEventsState } from '@revoke.cash/core/db/schema/indexer';
import { premiumPlans, premiumSubscriptions } from '@revoke.cash/core/db/schema/premium';
import type { PremiumPlanTier } from '@revoke.cash/core/premium/plans';
import { activeSubscriptionsQuery } from '@revoke.cash/core/premium/subscriptions';
import { deduplicateArray } from '@revoke.cash/core/utils';
import { and, desc, eq, inArray } from 'drizzle-orm';
import type { Address } from 'viem';

// Combined per-chain view of indexer.events_state and indexer.allowance_state for one address
export interface AddressIndexerState {
  chainId: number;
  lastScanAt: string | null;
  nextRunAt: string | null;
  consecutiveFailures: number;
  lastError: string | null;
  disabledAt: string | null;
  computedAt: string | null;
  lastEvaluatedAt: string | null;
  evaluationPending: boolean;
}

export const getAddressIndexerStates = async (address: Address): Promise<AddressIndexerState[]> => {
  const db = getDb();

  const [eventsStates, allowanceStates] = await Promise.all([
    db.query.indexerEventsState.findMany({ where: eq(indexerEventsState.address, address) }),
    db.query.indexerAllowanceState.findMany({ where: eq(indexerAllowanceState.address, address) }),
  ]);

  const eventsStatesByChain = new Map(eventsStates.map((state) => [state.chainId, state]));
  const allowanceStatesByChain = new Map(allowanceStates.map((state) => [state.chainId, state]));

  const chainIds = deduplicateArray([
    ...eventsStates.map((state) => state.chainId),
    ...allowanceStates.map((state) => state.chainId),
  ]).sort((left, right) => left - right);

  return chainIds.map((chainId) => {
    const eventsState = eventsStatesByChain.get(chainId);
    const allowanceState = allowanceStatesByChain.get(chainId);

    const computedAt = allowanceState?.computedAt ?? null;
    const lastEvaluatedAt = allowanceState?.lastEvaluatedAt ?? null;
    const evaluationPending = computedAt !== null && (lastEvaluatedAt === null || lastEvaluatedAt < computedAt);

    return {
      chainId,
      lastScanAt: eventsState?.lastScanAt?.toISOString() ?? null,
      nextRunAt: eventsState?.nextRunAt?.toISOString() ?? null,
      // Both pipeline stages track failures; surface whichever one is struggling
      consecutiveFailures: Math.max(eventsState?.consecutiveFailures ?? 0, allowanceState?.consecutiveFailures ?? 0),
      lastError: eventsState?.lastError ?? allowanceState?.lastError ?? null,
      disabledAt: eventsState?.disabledAt?.toISOString() ?? null,
      computedAt: computedAt?.toISOString() ?? null,
      lastEvaluatedAt: lastEvaluatedAt?.toISOString() ?? null,
      evaluationPending,
    };
  });
};

export interface AddressSubscription {
  subscriptionId: string;
  ownerAddress: Address;
  planName: string;
  tier: PremiumPlanTier;
  endsAt: string;
}

export const getAddressSubscriptions = async (address: Address): Promise<AddressSubscription[]> => {
  const db = getDb();

  const rows = await db
    .select({
      subscriptionId: premiumSubscriptions.id,
      ownerAddress: premiumSubscriptions.ownerAddress,
      planName: premiumPlans.name,
      tier: premiumPlans.tier,
      endsAt: premiumSubscriptions.endsAt,
    })
    .from(premiumSubscriptions)
    .innerJoin(
      premiumPlans,
      and(eq(premiumPlans.id, premiumSubscriptions.planId), eq(premiumPlans.version, premiumSubscriptions.planVersion)),
    )
    .where(inArray(premiumSubscriptions.id, activeSubscriptionsQuery(db, address)))
    .orderBy(desc(premiumSubscriptions.endsAt));

  return rows.map((row) => ({ ...row, endsAt: row.endsAt.toISOString() }));
};
