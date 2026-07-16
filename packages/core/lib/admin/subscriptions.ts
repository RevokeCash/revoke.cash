import {
  getSubscriptionAddressChangeCounts,
  type SubscriptionAddressChangeCounts,
} from '@revoke.cash/core/admin/audit';
import { REVENUE_EXCLUDED_CHAIN_IDS } from '@revoke.cash/core/admin/revenue';
import { getDb } from '@revoke.cash/core/db/client';
import { premiumPayments, premiumSubscriptions } from '@revoke.cash/core/db/schema/premium';
import type { PremiumPaymentStatus } from '@revoke.cash/core/premium/payments';
import type { PremiumPlan, PremiumPlanTier } from '@revoke.cash/core/premium/plans';
import { isSubscriptionActive } from '@revoke.cash/core/premium/subscriptions';
import { DAY } from '@revoke.cash/core/utils/time';
import { and, count, eq, gt, inArray, lt, lte, type SQL } from 'drizzle-orm';
import type { Address, Hash } from 'viem';

export type AdminSubscriptionFilter = 'all' | 'active' | 'expiring' | 'expired' | 'anomaly';

export interface AdminSubscriptionListItem {
  id: string;
  ownerAddress: Address;
  planId: string;
  planName: string;
  tier: PremiumPlanTier;
  startsAt: string;
  endsAt: string;
  createdAt: string;
  isActive: boolean;
  addressCount: number;
  maxAddresses: number;
  confirmedPaymentCount: number;
  totalPaidUsdCents: number;
}

export interface AdminSubscriptionsPage {
  items: AdminSubscriptionListItem[];
  totalCount: number;
}

interface GetAdminSubscriptionsParams {
  filter?: AdminSubscriptionFilter;
  ownerAddress?: Address;
  page?: number;
  pageSize?: number;
}

// Expired subscriptions with a recently confirmed payment should not exist: they indicate that a
// payment was confirmed without properly extending the subscription period.
const ANOMALY_PAYMENT_WINDOW_DAYS = 45;

const activeSubscriptionCondition = (now: Date) =>
  and(lte(premiumSubscriptions.startsAt, now), gt(premiumSubscriptions.endsAt, now));

const subscriptionFilterCondition = async (filter: AdminSubscriptionFilter): Promise<SQL | undefined | null> => {
  const now = new Date();

  switch (filter) {
    case 'all':
      return undefined;
    case 'active':
      return activeSubscriptionCondition(now);
    case 'expiring':
      return and(activeSubscriptionCondition(now), lt(premiumSubscriptions.endsAt, new Date(now.getTime() + 30 * DAY)));
    case 'expired':
      return lte(premiumSubscriptions.endsAt, now);
    case 'anomaly': {
      // Precomputed as an id list because a correlated subquery on the root table breaks inside
      // the relational query builder (findMany aliases the root table). Returns null (match
      // nothing) when there are no anomalies, since inArray requires a non-empty list.
      const anomalyIds = await findAnomalySubscriptionIds(now);
      return anomalyIds.length > 0 ? inArray(premiumSubscriptions.id, anomalyIds) : null;
    }
  }
};

const findAnomalySubscriptionIds = async (now: Date): Promise<string[]> => {
  const rows = await getDb()
    .selectDistinct({ id: premiumSubscriptions.id })
    .from(premiumSubscriptions)
    .innerJoin(premiumPayments, eq(premiumPayments.subscriptionId, premiumSubscriptions.id))
    .where(
      and(
        lte(premiumSubscriptions.endsAt, now),
        eq(premiumPayments.status, 'confirmed'),
        gt(premiumPayments.confirmedAt, new Date(now.getTime() - ANOMALY_PAYMENT_WINDOW_DAYS * DAY)),
      ),
    );

  return rows.map((row) => row.id);
};

export const getAdminSubscriptions = async ({
  filter = 'all',
  ownerAddress,
  page = 1,
  pageSize = 25,
}: GetAdminSubscriptionsParams): Promise<AdminSubscriptionsPage> => {
  const db = getDb();

  const filterCondition = await subscriptionFilterCondition(filter);
  if (filterCondition === null) {
    return { items: [], totalCount: 0 };
  }

  const conditions = and(
    filterCondition,
    ownerAddress ? eq(premiumSubscriptions.ownerAddress, ownerAddress) : undefined,
  );

  const [subscriptions, [{ totalCount }]] = await Promise.all([
    db.query.premiumSubscriptions.findMany({
      where: conditions,
      orderBy: (subscriptions, { desc }) => [desc(subscriptions.createdAt)],
      limit: pageSize,
      offset: (page - 1) * pageSize,
      with: {
        plan: { columns: { name: true, tier: true, maxAddresses: true } },
        addresses: { columns: { id: true } },
        payments: { columns: { amountUsdCents: true, status: true, chainId: true } },
      },
    }),
    db.select({ totalCount: count() }).from(premiumSubscriptions).where(conditions),
  ]);

  const items = subscriptions.map((subscription): AdminSubscriptionListItem => {
    // Testnet payments are excluded so the list totals line up with the revenue aggregates
    const confirmedPayments = subscription.payments.filter(
      (payment) => payment.status === 'confirmed' && !REVENUE_EXCLUDED_CHAIN_IDS.includes(payment.chainId),
    );

    return {
      id: subscription.id,
      ownerAddress: subscription.ownerAddress,
      planId: subscription.planId,
      planName: subscription.plan.name,
      tier: subscription.plan.tier,
      startsAt: subscription.startsAt.toISOString(),
      endsAt: subscription.endsAt.toISOString(),
      createdAt: subscription.createdAt.toISOString(),
      isActive: isSubscriptionActive(subscription),
      addressCount: subscription.addresses.length,
      maxAddresses: subscription.plan.maxAddresses,
      confirmedPaymentCount: confirmedPayments.length,
      totalPaidUsdCents: confirmedPayments.reduce((sum, payment) => sum + payment.amountUsdCents, 0),
    };
  });

  return { items, totalCount };
};

export interface AdminPayment {
  id: string;
  status: PremiumPaymentStatus;
  amountUsdCents: number;
  chainId: number;
  tokenSymbol: string;
  txHash: Hash | null;
  vatRegion: string | null;
  scanFromBlock: string;
  createdAt: string;
  expiresAt: string;
  confirmedAt: string | null;
  planId: string;
  planName: string;
}

export interface AdminSubscriptionDetail {
  id: string;
  ownerAddress: Address;
  plan: Pick<PremiumPlan, 'id' | 'name' | 'priceUsdCents' | 'durationDays' | 'maxAddresses' | 'tier'>;
  isActive: boolean;
  startsAt: string;
  endsAt: string;
  createdAt: string;
  addresses: Array<{ address: Address; addedBy: Address; createdAt: string }>;
  addressChangesLast30Days: SubscriptionAddressChangeCounts;
  payments: AdminPayment[];
}

export const getAdminSubscription = async (subscriptionId: string): Promise<AdminSubscriptionDetail | null> => {
  const db = getDb();

  const [subscription, addressChangesLast30Days] = await Promise.all([
    db.query.premiumSubscriptions.findFirst({
      where: eq(premiumSubscriptions.id, subscriptionId),
      with: {
        plan: {
          columns: { id: true, name: true, priceUsdCents: true, durationDays: true, maxAddresses: true, tier: true },
        },
        addresses: { columns: { address: true, addedBy: true, createdAt: true } },
        payments: {
          orderBy: (payments, { desc }) => [desc(payments.createdAt)],
          with: { plan: { columns: { id: true, name: true } } },
        },
      },
    }),
    getSubscriptionAddressChangeCounts(subscriptionId, new Date(Date.now() - 30 * DAY)),
  ]);

  if (!subscription) return null;

  return {
    id: subscription.id,
    ownerAddress: subscription.ownerAddress,
    plan: subscription.plan,
    isActive: isSubscriptionActive(subscription),
    startsAt: subscription.startsAt.toISOString(),
    endsAt: subscription.endsAt.toISOString(),
    createdAt: subscription.createdAt.toISOString(),
    addresses: subscription.addresses.map((entry) => ({
      address: entry.address,
      addedBy: entry.addedBy,
      createdAt: entry.createdAt.toISOString(),
    })),
    addressChangesLast30Days,
    payments: subscription.payments.map(
      (payment): AdminPayment => ({
        id: payment.id,
        status: payment.status,
        amountUsdCents: payment.amountUsdCents,
        chainId: payment.chainId,
        tokenSymbol: payment.tokenSymbol,
        txHash: payment.matchedTxHash,
        vatRegion: payment.vatRegion,
        scanFromBlock: payment.scanFromBlock.toString(),
        createdAt: payment.createdAt.toISOString(),
        expiresAt: payment.expiresAt.toISOString(),
        confirmedAt: payment.confirmedAt?.toISOString() ?? null,
        planId: payment.plan.id,
        planName: payment.plan.name,
      }),
    ),
  };
};

// Annual run rate over active subscriptions: each plan price normalized to a yearly amount
export interface AnnualRunRate {
  totalUsdCents: number;
  byTier: Record<PremiumPlanTier, number>;
}

export const getAnnualRunRate = async (): Promise<AnnualRunRate> => {
  const db = getDb();
  const now = new Date();

  const activeSubscriptions = await db.query.premiumSubscriptions.findMany({
    where: activeSubscriptionCondition(now),
    columns: {},
    with: { plan: { columns: { priceUsdCents: true, durationDays: true, tier: true } } },
  });

  const byTier: Record<PremiumPlanTier, number> = { premium: 0, ultimate: 0 };
  for (const subscription of activeSubscriptions) {
    const annualizedUsdCents = Math.round((subscription.plan.priceUsdCents * 365) / subscription.plan.durationDays);
    byTier[subscription.plan.tier] += annualizedUsdCents;
  }

  return { totalUsdCents: byTier.premium + byTier.ultimate, byTier };
};
