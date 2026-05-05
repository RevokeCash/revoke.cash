import { type DatabaseTransaction, getDb, getTransactionalDb } from '@revoke.cash/core/db/client';
import { premiumSubscriptionAddresses, premiumSubscriptions } from '@revoke.cash/core/db/schema/premium';
import { registerAddressForMonitoring } from '@revoke.cash/core/monitor/register';
import { isNullish } from '@revoke.cash/core/utils';
import { DAY } from '@revoke.cash/core/utils/time';
import { and, count, eq, gt, sql } from 'drizzle-orm';
import type { Address } from 'viem';
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

  const subscription = await db.query.premiumSubscriptions.findFirst({
    where: and(eq(premiumSubscriptions.id, subscriptionId), eq(premiumSubscriptions.ownerAddress, ownerAddress)),
    columns: { id: true, startsAt: true, endsAt: true },
    with: { plan: { columns: { tier: true } } },
  });

  return !isNullish(subscription) && isUltimatePlan(subscription.plan) && isSubscriptionActive(subscription);
};

export const getOwnerSubscriptions = async (ownerAddress: Address): Promise<PremiumSubscription[]> => {
  const db = getDb();

  const subscriptions = await db.query.premiumSubscriptions.findMany({
    where: eq(premiumSubscriptions.ownerAddress, ownerAddress),
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
    const addresses = subscription.addresses.map((entry) => entry.address);

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
      ownerAddress: subscription.ownerAddress,
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
  ownerAddress: Address,
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

  return db.transaction(async (trx) => {
    const subscription = await findActiveSubscriptionForOwner(trx, subscriptionId, ownerAddress);

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
        eq(premiumSubscriptionAddresses.address, address),
      ),
      columns: { id: true },
    });

    if (existing) {
      throw new Error('Address already added to this subscription');
    }

    await trx.insert(premiumSubscriptionAddresses).values({
      subscriptionId: subscription.id,
      address,
      addedBy: ownerAddress,
    });

    await registerAddressForMonitoring(trx, address);

    return { success: true };
  });
};

export const removeSubscriptionAddress = async ({
  ownerAddress,
  subscriptionId,
  address,
}: ModifySubscriptionAddressParams) => {
  if (address.toLowerCase() === ownerAddress.toLowerCase()) {
    throw new Error('Cannot remove subscription owner address');
  }

  const db = getTransactionalDb();

  return db.transaction(async (trx) => {
    const subscription = await findActiveSubscriptionForOwner(trx, subscriptionId, ownerAddress);

    await trx
      .delete(premiumSubscriptionAddresses)
      .where(
        and(
          eq(premiumSubscriptionAddresses.subscriptionId, subscription.id),
          eq(premiumSubscriptionAddresses.address, address),
        ),
      );

    return { success: true };
  });
};

export interface ExtendOrCreateSubscriptionParams {
  ownerAddress: Address;
  planId: string;
  planVersion: number;
  plan: Pick<PremiumPlan, 'durationDays' | 'priceUsd'>;
  now: Date;
}

interface ExistingSubscriptionForUpsert {
  id: string;
  planId: string;
  plan: Pick<PremiumPlan, 'priceUsd'>;
}

export const extendOrCreateSubscription = async (
  trx: DatabaseTransaction,
  params: ExtendOrCreateSubscriptionParams,
): Promise<string> => {
  const existing = await trx.query.premiumSubscriptions.findFirst({
    where: and(eq(premiumSubscriptions.ownerAddress, params.ownerAddress), gt(premiumSubscriptions.endsAt, params.now)),
    orderBy: (sub, { desc }) => [desc(sub.endsAt)],
    columns: { id: true, planId: true },
    with: { plan: { columns: { priceUsd: true } } },
  });

  if (existing) {
    return extendExistingSubscription(trx, existing, params);
  }

  return createSubscription(trx, params);
};

// Note that this allows upgrading to a more expensive plan (converts the entire subscription to the new plan)
const extendExistingSubscription = async (
  trx: DatabaseTransaction,
  existing: ExistingSubscriptionForUpsert,
  params: ExtendOrCreateSubscriptionParams,
): Promise<string> => {
  const isUpgrade = params.planId !== existing.planId && params.plan.priceUsd > existing.plan.priceUsd;

  await trx
    .update(premiumSubscriptions)
    .set({
      endsAt: sql`${premiumSubscriptions.endsAt} + make_interval(days => ${params.plan.durationDays})`,
      ...(isUpgrade ? { planId: params.planId, planVersion: params.planVersion } : {}),
    })
    .where(eq(premiumSubscriptions.id, existing.id));

  return existing.id;
};

const createSubscription = async (
  trx: DatabaseTransaction,
  params: ExtendOrCreateSubscriptionParams,
): Promise<string> => {
  const [subscription] = await trx
    .insert(premiumSubscriptions)
    .values({
      planId: params.planId,
      planVersion: params.planVersion,
      ownerAddress: params.ownerAddress,
      startsAt: params.now,
      endsAt: new Date(params.now.getTime() + params.plan.durationDays * DAY),
    })
    .returning({ id: premiumSubscriptions.id });

  await trx
    .insert(premiumSubscriptionAddresses)
    .values({
      subscriptionId: subscription.id,
      address: params.ownerAddress,
      addedBy: params.ownerAddress,
    })
    .onConflictDoNothing();

  await registerAddressForMonitoring(trx, params.ownerAddress);

  return subscription.id;
};
