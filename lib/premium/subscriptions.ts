import { and, count, eq } from 'drizzle-orm';
import { type DatabaseTransaction, getDb, getTransactionalDb } from 'lib/db/client';
import { premiumSubscriptionAddresses, premiumSubscriptions } from 'lib/db/schema/premium';
import { type Address, getAddress } from 'viem';
import type { PremiumPlan } from './plans';

export interface PremiumSubscription {
  id: string;
  ownerAddress: Address;
  plan: Pick<PremiumPlan, 'name' | 'priceUsd' | 'durationDays' | 'maxAddresses'>;
  addresses: Address[];
  slots: {
    used: number;
    max: number;
  };
  startsAt: string;
  endsAt: string;
  createdAt: string;
  isActive: boolean;
}

export const getOwnerSubscriptions = async (ownerAddress: Address): Promise<PremiumSubscription[]> => {
  const db = getDb();
  const normalizedOwner = ownerAddress.toLowerCase();

  const subscriptions = await db.query.premiumSubscriptions.findMany({
    where: eq(premiumSubscriptions.ownerAddress, normalizedOwner),
    orderBy: (subscriptions, { desc }) => [desc(subscriptions.createdAt)],
    with: {
      plan: { columns: { name: true, priceUsd: true, durationDays: true, maxAddresses: true } },
      addresses: { columns: { address: true } },
    },
  });

  return subscriptions
    .map((subscription) => {
      const plan = subscription.plan;
      if (!plan) return null;

      const addresses = subscription.addresses.map((entry) => getAddress(entry.address));

      return {
        id: subscription.id,
        ownerAddress: getAddress(ownerAddress),
        plan,
        addresses,
        slots: {
          used: addresses.length,
          max: plan.maxAddresses,
        },
        startsAt: subscription.startsAt.toISOString(),
        endsAt: subscription.endsAt.toISOString(),
        createdAt: subscription.createdAt.toISOString(),
        isActive: subscription.startsAt.getTime() <= Date.now() && subscription.endsAt.getTime() > Date.now(),
      };
    })
    .filter((subscription) => subscription !== null);
};

interface ModifySubscriptionAddressParams {
  ownerAddress: Address;
  subscriptionId: string;
  address: Address;
}

const findActiveSubscriptionForOwner = async (
  trx: DatabaseTransaction,
  subscriptionId: string,
  ownerAddress: string,
) => {
  const subscription = await trx.query.premiumSubscriptions.findFirst({
    where: and(eq(premiumSubscriptions.id, subscriptionId), eq(premiumSubscriptions.ownerAddress, ownerAddress)),
    columns: { id: true, endsAt: true },
    with: { plan: { columns: { maxAddresses: true } } },
  });

  if (!subscription || !subscription.plan) {
    throw new Error('Subscription not found');
  }

  if (subscription.endsAt.getTime() <= Date.now()) {
    throw new Error('Subscription has expired');
  }

  return subscription;
};

export const addSubscriptionAddress = async ({
  ownerAddress,
  subscriptionId,
  address,
}: ModifySubscriptionAddressParams) => {
  const db = getTransactionalDb();
  const normalizedOwner = ownerAddress.toLowerCase();
  const normalizedAddress = address.toLowerCase();

  return db.transaction(async (trx) => {
    const subscription = await findActiveSubscriptionForOwner(trx, subscriptionId, normalizedOwner);

    const [{ count: usedSlots }] = await trx
      .select({ count: count() })
      .from(premiumSubscriptionAddresses)
      .where(eq(premiumSubscriptionAddresses.subscriptionId, subscription.id));

    if (usedSlots >= subscription.plan.maxAddresses) {
      throw new Error('No available address slots');
    }

    const existing = await trx.query.premiumSubscriptionAddresses.findFirst({
      where: and(
        eq(premiumSubscriptionAddresses.subscriptionId, subscription.id),
        eq(premiumSubscriptionAddresses.address, normalizedAddress),
      ),
      columns: { id: true },
    });

    if (existing) {
      throw new Error('Address already added to this subscription');
    }

    await trx.insert(premiumSubscriptionAddresses).values({
      subscriptionId: subscription.id,
      address: normalizedAddress,
      addedBy: normalizedOwner,
    });

    return { success: true };
  });
};

export const removeSubscriptionAddress = async ({
  ownerAddress,
  subscriptionId,
  address,
}: ModifySubscriptionAddressParams) => {
  const normalizedOwner = ownerAddress.toLowerCase();
  const normalizedAddress = address.toLowerCase();

  if (normalizedAddress === normalizedOwner) {
    throw new Error('Cannot remove subscription owner address');
  }

  const db = getTransactionalDb();

  return db.transaction(async (trx) => {
    const subscription = await findActiveSubscriptionForOwner(trx, subscriptionId, normalizedOwner);

    await trx
      .delete(premiumSubscriptionAddresses)
      .where(
        and(
          eq(premiumSubscriptionAddresses.subscriptionId, subscription.id),
          eq(premiumSubscriptionAddresses.address, normalizedAddress),
        ),
      );

    return { success: true };
  });
};
