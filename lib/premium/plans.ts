import { and, eq } from 'drizzle-orm';
import { getDb } from 'lib/db/client';
import { premiumPlans } from 'lib/db/schema/premium';
import { PREMIUM_PAYMENT_CHAIN_IDS } from './payment-config';

export interface PremiumPlan {
  id: string;
  version: number;
  name: string;
  priceUsd: number;
  tokenSymbol: 'USDC';
  supportedChainIds: readonly number[];
  maxAddresses: number;
  durationDays: number;
}

export type PremiumPlanRecord = typeof premiumPlans.$inferSelect;

export const DEFAULT_PREMIUM_PLANS: PremiumPlan[] = [
  {
    id: 'individual_annual',
    version: 1,
    name: 'Premium Individual',
    priceUsd: 99,
    tokenSymbol: 'USDC',
    supportedChainIds: PREMIUM_PAYMENT_CHAIN_IDS,
    durationDays: 365,
    maxAddresses: 1,
  },
  {
    id: 'bundle10_annual',
    version: 1,
    name: 'Premium Bundle (10)',
    priceUsd: 299,
    tokenSymbol: 'USDC',
    supportedChainIds: PREMIUM_PAYMENT_CHAIN_IDS,
    durationDays: 365,
    maxAddresses: 10,
  },
];

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
  };
};

export const getPremiumPlans = async (): Promise<PremiumPlan[]> => {
  const db = getDb();

  const planRows = await db.query.premiumPlans.findMany({
    where: eq(premiumPlans.isActive, true),
    orderBy: (plans, { asc }) => [asc(plans.id)],
  });
  return planRows.map(mapPlanRecord);
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
