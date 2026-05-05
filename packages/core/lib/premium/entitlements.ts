import { getDb } from '@revoke.cash/core/db/client';
import { premiumSubscriptionAddresses } from '@revoke.cash/core/db/schema/premium';
import { eq } from 'drizzle-orm';
import type { Address } from 'viem';
import { isUltimatePlan, type PremiumPlanTier } from './plans';
import { isSubscriptionActive } from './subscriptions';

export interface PremiumEntitlement {
  planName: string;
  tier: PremiumPlanTier;
  ownerAddress: Address;
  endsAt: string;
}

export const getActivePremiumEntitlements = async (address: Address): Promise<PremiumEntitlement[]> => {
  const db = getDb();

  const rows = await db.query.premiumSubscriptionAddresses.findMany({
    where: eq(premiumSubscriptionAddresses.address, address),
    columns: { id: true },
    with: {
      subscription: {
        columns: { ownerAddress: true, startsAt: true, endsAt: true },
        with: { plan: { columns: { name: true, tier: true } } },
      },
    },
  });

  return rows
    .filter(({ subscription }) => isSubscriptionActive(subscription))
    .map(({ subscription }) => ({
      planName: subscription.plan.name,
      tier: subscription.plan.tier,
      ownerAddress: subscription.ownerAddress,
      endsAt: subscription.endsAt.toISOString(),
    }));
};

export const hasActivePremiumEntitlement = async (address: Address): Promise<boolean> => {
  try {
    const entitlements = await getActivePremiumEntitlements(address);
    return entitlements.length > 0;
  } catch (e) {
    console.error('Failed to check premium entitlement, falling back to free experience', e);
    return false;
  }
};

export const hasActiveUltimateEntitlement = async (address: Address): Promise<boolean> => {
  try {
    const entitlements = await getActivePremiumEntitlements(address);
    return entitlements.some((entitlement) => isUltimatePlan(entitlement));
  } catch (e) {
    console.error('Failed to check ultimate entitlement, denying access', e);
    return false;
  }
};

// Exclude the owner's own entitlements from the list.
export const getGrantedEntitlements = async (address: Address): Promise<PremiumEntitlement[]> => {
  const entitlements = await getActivePremiumEntitlements(address);
  return entitlements.filter((entitlement) => entitlement.ownerAddress.toLowerCase() !== address.toLowerCase());
};
