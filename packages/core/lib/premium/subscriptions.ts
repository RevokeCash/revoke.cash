import { type DatabaseTransaction, getDb, getTransactionalDb } from '@revoke.cash/core/db/client';
import { premiumSubscriptionAddresses, premiumSubscriptions } from '@revoke.cash/core/db/schema/premium';
import { isNullish } from '@revoke.cash/core/utils';
import { and, count, eq } from 'drizzle-orm';
import { type Address, getAddress } from 'viem';
import { isUltimatePlan, type PremiumPlan } from './plans';

export interface SubscriptionPayment {
  amountUsd: number;
  chainId: number;
  tokenSymbol: string;
  txHash: string | null;
  paidAt: string | null;
  planId: string;
  planName: string;
}

export interface PremiumSubscription {
  id: string;
  ownerAddress: Address;
  plan: Pick<PremiumPlan, 'id' | 'name' | 'priceUsd' | 'durationDays' | 'maxAddresses' | 'tier'>;
  addresses: Address[];
  slots: {
    used: number;
    max: number;
  };
  startsAt: string;
  endsAt: string;
  createdAt: string;
  payments: SubscriptionPayment[];
}

export type PremiumSubscriptionRecord = typeof premiumSubscriptions.$inferSelect;

export const isSubscriptionActive = (
  subscription: { startsAt: Date | string; endsAt: Date | string },
  now: number = Date.now(),
): boolean => {
  const startsAt = new Date(subscription.startsAt);
  const endsAt = new Date(subscription.endsAt);
  return startsAt.getTime() <= now && endsAt.getTime() > now;
};

export const isActiveUltimateSubscriptionOwnedBy = async (
  subscriptionId: string,
  ownerAddress: Address,
): Promise<boolean> => {
  const db = getDb();
  const normalizedOwner = ownerAddress.toLowerCase();

  const subscription = await db.query.premiumSubscriptions.findFirst({
    where: and(eq(premiumSubscriptions.id, subscriptionId), eq(premiumSubscriptions.ownerAddress, normalizedOwner)),
    columns: { id: true, startsAt: true, endsAt: true },
    with: { plan: { columns: { tier: true } } },
  });

  return !isNullish(subscription) && isUltimatePlan(subscription.plan) && isSubscriptionActive(subscription);
};

export const getOwnerSubscriptions = async (ownerAddress: Address): Promise<PremiumSubscription[]> => {
  const db = getDb();
  const normalizedOwner = ownerAddress.toLowerCase();

  const subscriptions = await db.query.premiumSubscriptions.findMany({
    where: eq(premiumSubscriptions.ownerAddress, normalizedOwner),
    orderBy: (subscriptions, { desc }) => [desc(subscriptions.createdAt)],
    with: {
      plan: { columns: { id: true, name: true, priceUsd: true, durationDays: true, maxAddresses: true, tier: true } },
      addresses: { columns: { address: true } },
      payments: {
        columns: { amountUsd: true, chainId: true, tokenSymbol: true, matchedTxHash: true, confirmedAt: true },
        with: { plan: { columns: { id: true, name: true } } },
        where: (payments, { eq }) => eq(payments.status, 'confirmed'),
        orderBy: (payments, { desc }) => [desc(payments.confirmedAt)],
      },
    },
  });

  return subscriptions.map((subscription) => {
    const addresses = subscription.addresses.map((entry) => getAddress(entry.address));

    const payments: SubscriptionPayment[] = subscription.payments.map((payment) => ({
      amountUsd: payment.amountUsd,
      chainId: payment.chainId,
      tokenSymbol: payment.tokenSymbol,
      txHash: payment.matchedTxHash,
      paidAt: payment.confirmedAt?.toISOString() ?? null,
      planId: payment.plan.id,
      planName: payment.plan.name,
    }));

    return {
      id: subscription.id,
      ownerAddress: getAddress(ownerAddress),
      plan: subscription.plan,
      addresses,
      slots: {
        used: addresses.length,
        max: subscription.plan.maxAddresses,
      },
      startsAt: subscription.startsAt.toISOString(),
      endsAt: subscription.endsAt.toISOString(),
      createdAt: subscription.createdAt.toISOString(),
      payments,
    };
  });
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

  if (!subscription) {
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
      throw new Error('No available wallet slots');
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
