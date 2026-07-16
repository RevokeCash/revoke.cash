import { wakeSubscriptionInactiveActions } from '@revoke.cash/core/auto-revoke/actions';
import { type DatabaseTransaction, type DatabaseWriter, getDb, getTransactionalDb } from '@revoke.cash/core/db/client';
import {
  premiumPayments,
  premiumPlans,
  premiumSubscriptionAddresses,
  premiumSubscriptions,
} from '@revoke.cash/core/db/schema/premium';
import { acquireAdvisoryLock } from '@revoke.cash/core/db/utils';
import { registerAddressForIndexing } from '@revoke.cash/core/indexer/register';
import { isNullish } from '@revoke.cash/core/utils';
import { ExportableError } from '@revoke.cash/core/utils/errors';
import { DAY } from '@revoke.cash/core/utils/time';
import { and, count, eq, gt, isNotNull, lte, sql } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import type { Address } from 'viem';
import { isUltimatePlan, type PremiumPlan } from './plans';

export interface SubscriptionPaymentRefundRequest {
  refundAmountUsdCents: number;
  requestedAt: string;
  processedAt: string | null;
  refundTxHash: string | null;
}

export interface SubscriptionPayment {
  id: string;
  amountUsdCents: number;
  chainId: number;
  tokenSymbol: string;
  txHash: string | null;
  paidAt: string | null;
  planId: string;
  planName: string;
  refundRequest: SubscriptionPaymentRefundRequest | null;
}

export interface PremiumSubscription {
  id: string;
  ownerAddress: Address;
  plan: Pick<PremiumPlan, 'id' | 'name' | 'priceUsdCents' | 'durationDays' | 'maxAddresses' | 'tier'>;
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

export class PremiumSubscriptionError extends ExportableError {
  constructor(message: string) {
    super(message);
    this.name = 'PremiumSubscriptionError';
  }

  export() {
    return { status: 400, body: { message: this.message } };
  }
}

export const isSubscriptionActive = (
  subscription: { startsAt: Date | string; endsAt: Date | string },
  now: number = Date.now(),
): boolean => {
  const startsAt = new Date(subscription.startsAt);
  const endsAt = new Date(subscription.endsAt);
  return startsAt.getTime() <= now && endsAt.getTime() > now;
};

// SQL counterpart of `isSubscriptionActive`: the ids of currently-active subscriptions covering
// `address`, which is either a literal address or a correlated column (for use inside `exists`).
export const activeSubscriptionsQuery = (
  db: DatabaseWriter,
  address: Address | AnyPgColumn,
  tier?: PremiumPlan['tier'],
) =>
  db
    .select({ id: premiumSubscriptions.id })
    .from(premiumSubscriptionAddresses)
    .innerJoin(premiumSubscriptions, eq(premiumSubscriptions.id, premiumSubscriptionAddresses.subscriptionId))
    .innerJoin(
      premiumPlans,
      and(eq(premiumPlans.id, premiumSubscriptions.planId), eq(premiumPlans.version, premiumSubscriptions.planVersion)),
    )
    .where(
      and(
        eq(premiumSubscriptionAddresses.address, address),
        tier ? eq(premiumPlans.tier, tier) : undefined,
        lte(premiumSubscriptions.startsAt, sql`now()`),
        gt(premiumSubscriptions.endsAt, sql`now()`),
      ),
    );

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
      plan: {
        columns: { id: true, name: true, priceUsdCents: true, durationDays: true, maxAddresses: true, tier: true },
      },
      addresses: { columns: { address: true } },
      payments: {
        columns: {
          id: true,
          amountUsdCents: true,
          chainId: true,
          tokenSymbol: true,
          matchedTxHash: true,
          confirmedAt: true,
        },
        with: {
          plan: { columns: { id: true, name: true } },
          refundRequests: {
            columns: { refundAmountUsdCents: true, createdAt: true, processedAt: true, refundTxHash: true },
            where: (requests, { isNull }) => isNull(requests.dismissedAt),
          },
        },
        // Refunded payments stay visible so the billing history keeps the user's record of the refund
        where: (payments, { inArray }) => inArray(payments.status, ['confirmed', 'refunded']),
        orderBy: (payments, { desc }) => [desc(payments.confirmedAt)],
      },
    },
  });

  return subscriptions.map((subscription) => {
    const addresses = subscription.addresses.map((entry) => entry.address);

    const payments: SubscriptionPayment[] = subscription.payments.map((payment) => {
      // At most one non-dismissed request exists per payment (partial unique index)
      const [refundRequest] = payment.refundRequests;

      return {
        id: payment.id,
        amountUsdCents: payment.amountUsdCents,
        chainId: payment.chainId,
        tokenSymbol: payment.tokenSymbol,
        txHash: payment.matchedTxHash,
        paidAt: payment.confirmedAt?.toISOString() ?? null,
        planId: payment.plan.id,
        planName: payment.plan.name,
        refundRequest: refundRequest
          ? {
              refundAmountUsdCents: refundRequest.refundAmountUsdCents,
              requestedAt: refundRequest.createdAt.toISOString(),
              processedAt: refundRequest.processedAt?.toISOString() ?? null,
              refundTxHash: refundRequest.refundTxHash,
            }
          : null,
      };
    });

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
    throw new PremiumSubscriptionError('Subscription not found');
  }

  if (subscription.endsAt.getTime() <= Date.now()) {
    throw new PremiumSubscriptionError('Subscription has expired');
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
    await acquireAdvisoryLock(trx, `premium_subscription_addresses:${subscriptionId}`);

    const subscription = await findActiveSubscriptionForOwner(trx, subscriptionId, ownerAddress);

    const [{ count: usedSlots }] = await trx
      .select({ count: count() })
      .from(premiumSubscriptionAddresses)
      .where(eq(premiumSubscriptionAddresses.subscriptionId, subscription.id));

    if (usedSlots >= subscription.plan.maxAddresses) {
      throw new PremiumSubscriptionError('No available wallet slots');
    }

    const existing = await trx.query.premiumSubscriptionAddresses.findFirst({
      where: and(
        eq(premiumSubscriptionAddresses.subscriptionId, subscription.id),
        eq(premiumSubscriptionAddresses.address, address),
      ),
      columns: { id: true },
    });

    if (existing) {
      throw new PremiumSubscriptionError('Address already added to this subscription');
    }

    await trx.insert(premiumSubscriptionAddresses).values({
      subscriptionId: subscription.id,
      address,
      addedBy: ownerAddress,
    });

    await registerAddressForIndexing(trx, address);
    await wakeSubscriptionInactiveActions(trx, subscription.id);

    return { success: true };
  });
};

export const removeSubscriptionAddress = async ({
  ownerAddress,
  subscriptionId,
  address,
}: ModifySubscriptionAddressParams) => {
  if (address.toLowerCase() === ownerAddress.toLowerCase()) {
    throw new PremiumSubscriptionError('Cannot remove subscription owner address');
  }

  const db = getTransactionalDb();

  return db.transaction(async (trx) => {
    const subscription = await findActiveSubscriptionForOwner(trx, subscriptionId, ownerAddress);

    const deletedRows = await trx
      .delete(premiumSubscriptionAddresses)
      .where(
        and(
          eq(premiumSubscriptionAddresses.subscriptionId, subscription.id),
          eq(premiumSubscriptionAddresses.address, address),
        ),
      )
      .returning({ id: premiumSubscriptionAddresses.id });

    return { success: true, removed: deletedRows.length > 0 };
  });
};

export interface CreateSubscriptionParams {
  ownerAddress: Address;
  planId: string;
  planVersion: number;
  plan: Pick<PremiumPlan, 'durationDays' | 'priceUsdCents'>;
  now: Date;
}

interface SubscriptionPlanState {
  planId: string;
  planVersion: number;
  priceUsdCents: number;
  endsAt: Date;
}

interface AppliedPayment {
  planId: string;
  planVersion: number;
  plan: Pick<PremiumPlan, 'durationDays' | 'priceUsdCents'>;
  paidAt: Date;
}

export const findOrCreateSubscriptionForOwner = async (
  trx: DatabaseTransaction,
  params: CreateSubscriptionParams,
): Promise<string> => {
  await acquireAdvisoryLock(trx, `premium_subscription_owner:${params.ownerAddress.toLowerCase()}`);

  const existing = await trx.query.premiumSubscriptions.findFirst({
    where: eq(premiumSubscriptions.ownerAddress, params.ownerAddress),
    orderBy: (sub, { desc }) => [desc(sub.endsAt)],
    columns: { id: true },
  });

  if (existing) return existing.id;

  return createSubscription(trx, params);
};

// Recomputes the subscription's plan and end date by replaying its confirmed payments in order
export const rebuildSubscriptionFromPayments = async (
  trx: DatabaseTransaction,
  subscriptionId: string,
): Promise<void> => {
  const subscription = await trx.query.premiumSubscriptions.findFirst({
    where: eq(premiumSubscriptions.id, subscriptionId),
    columns: { id: true, startsAt: true },
  });
  if (!subscription) return;

  const confirmedPayments = await trx.query.premiumPayments.findMany({
    where: and(
      eq(premiumPayments.subscriptionId, subscriptionId),
      eq(premiumPayments.status, 'confirmed'),
      isNotNull(premiumPayments.confirmedAt),
    ),
    orderBy: (payments, { asc }) => [asc(payments.confirmedAt), asc(payments.id)],
    with: { plan: { columns: { durationDays: true, priceUsdCents: true } } },
  });

  // With no confirmed payments left, the subscription collapses to a zero-length period
  if (confirmedPayments.length === 0) {
    await trx
      .update(premiumSubscriptions)
      .set({ endsAt: subscription.startsAt })
      .where(eq(premiumSubscriptions.id, subscriptionId));
    return;
  }

  const rebuiltSubscription = confirmedPayments.reduce(
    (state, payment) =>
      applyPaymentToSubscription(state, {
        planId: payment.planId,
        planVersion: payment.planVersion,
        plan: payment.plan,
        paidAt: payment.confirmedAt!,
      }),
    { planId: '', planVersion: 0, priceUsdCents: 0, endsAt: new Date(0) },
  );

  await trx
    .update(premiumSubscriptions)
    .set({
      planId: rebuiltSubscription.planId,
      planVersion: rebuiltSubscription.planVersion,
      endsAt: rebuiltSubscription.endsAt,
    })
    .where(eq(premiumSubscriptions.id, subscriptionId));

  if (rebuiltSubscription.endsAt.getTime() > Date.now()) {
    await wakeSubscriptionInactiveActions(trx, subscriptionId);
  }
};

// Transitions a payment between verification-driven statuses and replays the subscription's remaining
// confirmed payments, so the subscription always reflects the payments that verifiably happened.
// 'refunded' (EU right of withdrawal) is deliberately only a destination: nothing transitions out of it.
export const transitionPaymentAndRebuild = async (
  trx: DatabaseTransaction,
  paymentId: string,
  fromStatus: 'confirmed' | 'reversed',
  toStatus: 'confirmed' | 'reversed' | 'refunded',
): Promise<boolean> => {
  // Lock the payment row so a concurrent reconciliation or sweep cannot interleave
  const [lockedPayment] = await trx
    .select({
      status: premiumPayments.status,
      subscriptionId: premiumPayments.subscriptionId,
      ownerAddress: premiumPayments.ownerAddress,
    })
    .from(premiumPayments)
    .where(eq(premiumPayments.id, paymentId))
    .for('update');

  if (lockedPayment?.status !== fromStatus) return false;

  // The same lock findOrCreateSubscriptionForOwner takes, so the rebuild cannot race a renewal
  await acquireAdvisoryLock(trx, `premium_subscription_owner:${lockedPayment.ownerAddress.toLowerCase()}`);

  await trx.update(premiumPayments).set({ status: toStatus }).where(eq(premiumPayments.id, paymentId));

  if (lockedPayment.subscriptionId) {
    await rebuildSubscriptionFromPayments(trx, lockedPayment.subscriptionId);
  }

  return true;
};

const applyPaymentToSubscription = (current: SubscriptionPlanState, payment: AppliedPayment): SubscriptionPlanState => {
  const isExpired = current.endsAt.getTime() <= payment.paidAt.getTime();

  if (isExpired) {
    return {
      planId: payment.planId,
      planVersion: payment.planVersion,
      priceUsdCents: payment.plan.priceUsdCents,
      endsAt: new Date(payment.paidAt.getTime() + payment.plan.durationDays * DAY),
    };
  }

  const isUpgrade = payment.planId !== current.planId && payment.plan.priceUsdCents > current.priceUsdCents;

  return {
    planId: isUpgrade ? payment.planId : current.planId,
    planVersion: isUpgrade ? payment.planVersion : current.planVersion,
    priceUsdCents: isUpgrade ? payment.plan.priceUsdCents : current.priceUsdCents,
    endsAt: new Date(current.endsAt.getTime() + payment.plan.durationDays * DAY),
  };
};

const createSubscription = async (trx: DatabaseTransaction, params: CreateSubscriptionParams): Promise<string> => {
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

  await registerAddressForIndexing(trx, params.ownerAddress);

  return subscription.id;
};
