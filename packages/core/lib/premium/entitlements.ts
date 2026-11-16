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
  const entitlements = await getActivePremiumEntitlementsWithSingleRetry(address);
  return entitlements.length > 0;
};

export const hasActiveUltimateEntitlement = async (address: Address): Promise<boolean> => {
  const entitlements = await getActivePremiumEntitlementsWithSingleRetry(address);
  return entitlements.some((entitlement) => isUltimatePlan(entitlement));
};

// One retry, so a transient database hiccup doesn't surface as an error page
export const getActivePremiumEntitlementsWithSingleRetry = async (address: Address): Promise<PremiumEntitlement[]> => {
  return getActivePremiumEntitlements(address).catch(() => getActivePremiumEntitlements(address));
};

// Exclude the owner's own entitlements from the list.
export const getGrantedEntitlements = async (address: Address): Promise<PremiumEntitlement[]> => {
  const entitlements = await getActivePremiumEntitlements(address);
  return entitlements.filter((entitlement) => entitlement.ownerAddress.toLowerCase() !== address.toLowerCase());
};

export interface EntitlementSummary {
  isPremium: boolean;
  isUltimate: boolean;
  ownTier: PremiumPlanTier | null;
  grantedTier: PremiumPlanTier | null;
  // Only the end of the address's own subscriptions, so the summary does not reveal when someone else's ends
  ownEndsAt: string | null;
}

// Collapses an address's entitlements into the tier levels the checkout needs, split by whether
// the access comes from an own subscription or through someone else's
export const summarizeEntitlements = (address: Address, entitlements: PremiumEntitlement[]): EntitlementSummary => {
  const ownEntitlements = entitlements.filter(
    (entitlement) => entitlement.ownerAddress.toLowerCase() === address.toLowerCase(),
  );
  const grantedEntitlements = entitlements.filter(
    (entitlement) => entitlement.ownerAddress.toLowerCase() !== address.toLowerCase(),
  );

  return {
    isPremium: entitlements.length > 0,
    isUltimate: highestTier(entitlements) === 'ultimate',
    ownTier: highestTier(ownEntitlements),
    grantedTier: highestTier(grantedEntitlements),
    ownEndsAt: latestEndsAt(ownEntitlements),
  };
};

const latestEndsAt = (entitlements: PremiumEntitlement[]): string | null => {
  const endDates = entitlements.map((entitlement) => entitlement.endsAt);
  return endDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null;
};

const highestTier = (entitlements: PremiumEntitlement[]): PremiumPlanTier | null => {
  if (entitlements.some((entitlement) => isUltimatePlan(entitlement))) return 'ultimate';
  return entitlements.length > 0 ? 'premium' : null;
};
