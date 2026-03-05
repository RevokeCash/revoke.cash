import { eq } from 'drizzle-orm';
import { getDb } from 'lib/db/client';
import { premiumSubscriptionAddresses } from 'lib/db/schema/premium';
import type { Address } from 'viem';

export const hasActivePremiumEntitlement = async (address: Address): Promise<boolean> => {
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
};
