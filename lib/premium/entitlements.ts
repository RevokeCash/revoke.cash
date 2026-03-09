import { eq } from 'drizzle-orm';
import { getDb } from 'lib/db/client';
import { premiumSubscriptionAddresses } from 'lib/db/schema/premium';
import { type Address, getAddress } from 'viem';

export interface GrantedEntitlement {
  planName: string;
  ownerAddress: Address;
  endsAt: string;
}

export const hasActivePremiumEntitlement = async (address: Address): Promise<boolean> => {
  try {
    const db = getDb();
    const now = new Date();

    const normalizedAddress = address.toLowerCase();

    const entitlementRows = await db.query.premiumSubscriptionAddresses.findMany({
      where: eq(premiumSubscriptionAddresses.address, normalizedAddress),
      columns: { id: true },
      with: { subscription: { columns: { startsAt: true, endsAt: true } } },
    });

    return entitlementRows.some((row) => {
      return row.subscription.startsAt.getTime() <= now.getTime() && row.subscription.endsAt.getTime() > now.getTime();
    });
  } catch (e) {
    console.error('Failed to check premium entitlement, falling back to free experience', e);
    return false;
  }
};

export const getGrantedEntitlements = async (address: Address): Promise<GrantedEntitlement[]> => {
  const db = getDb();
  const now = new Date();

  const normalizedAddress = address.toLowerCase();

  const entitlementRows = await db.query.premiumSubscriptionAddresses.findMany({
    where: eq(premiumSubscriptionAddresses.address, normalizedAddress),
    columns: { id: true },
    with: {
      subscription: {
        columns: { ownerAddress: true, startsAt: true, endsAt: true },
        with: { plan: { columns: { name: true } } },
      },
    },
  });

  return entitlementRows
    .filter((row) => {
      const isActive =
        row.subscription.startsAt.getTime() <= now.getTime() && row.subscription.endsAt.getTime() > now.getTime();
      const isGranted = row.subscription.ownerAddress !== normalizedAddress;
      return isActive && isGranted;
    })
    .map((row) => ({
      planName: row.subscription.plan.name,
      ownerAddress: getAddress(row.subscription.ownerAddress),
      endsAt: row.subscription.endsAt.toISOString(),
    }));
};
