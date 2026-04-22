import { getDb } from '@revoke.cash/core/db/client';
import { premiumPlans } from '@revoke.cash/core/db/schema/premium';
import { and, eq } from 'drizzle-orm';
import { PREMIUM_PAYMENT_CHAIN_IDS } from './payment-config';

export type PremiumPlanTier = 'premium' | 'ultimate';

export interface PremiumPlan {
  id: string;
  version: number;
  name: string;
  priceUsd: number;
  tokenSymbol: 'USDC';
  supportedChainIds: readonly number[];
  maxAddresses: number;
  durationDays: number;
  tier: PremiumPlanTier;
}

export type PremiumPlanRecord = typeof premiumPlans.$inferSelect;

const mapPlanRecord = (plan: PremiumPlanRecord): PremiumPlan => {
  return {
    id: plan.id,
    name: plan.name,
    version: plan.version,
    priceUsd: plan.priceUsd,
    tokenSymbol: 'USDC',
    supportedChainIds: PREMIUM_PAYMENT_CHAIN_IDS,
    maxAddresses: plan.maxAddresses,
    durationDays: plan.durationDays,
    tier: plan.tier,
  };
};

export const getPremiumPlans = async (): Promise<PremiumPlan[]> => {
  const db = getDb();

  const planRows = await db.query.premiumPlans.findMany({
    where: eq(premiumPlans.isActive, true),
    orderBy: (plans, { asc }) => [asc(plans.priceUsd)],
  });
  return planRows.map(mapPlanRecord);
};

export const isUltimatePlan = (plan: Pick<PremiumPlan, 'tier'>): boolean => {
  return plan.tier === 'ultimate';
};

export const getPremiumPlanById = async (planId: string): Promise<PremiumPlan | null> => {
  const db = getDb();

  const plan = await db.query.premiumPlans.findFirst({
    where: and(eq(premiumPlans.id, planId), eq(premiumPlans.isActive, true)),
    orderBy: (plans, { desc }) => [desc(plans.version)],
  });

  if (!plan) {
    return null;
  }

  return mapPlanRecord(plan);
};
