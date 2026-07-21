import { ChainId } from '@revoke.cash/chains';

// The revenue policy and every pure derivation over money data. This module is db-free so the
// web app can run the same derivations client-side that the API routes run server-side; the
// database queries feeding it live in ./revenue-queries.

export const REVENUE_EXCLUDED_CHAIN_IDS: number[] = [ChainId.EthereumSepolia];

// Revenue-eligible premium payment: confirmed, with a confirmation time, paid (complimentary
// grants are $0), not on a testnet
const isRevenueEligiblePayment = (payment: RevenuePayment): payment is RevenuePayment & { confirmedAt: string } =>
  payment.status === 'confirmed' &&
  payment.confirmedAt !== null &&
  payment.amountUsdCents > 0 &&
  !REVENUE_EXCLUDED_CHAIN_IDS.includes(payment.chainId);

// Revenue-eligible batch revokes: not on a testnet and not sponsored (fees were waived)
const isRevenueEligibleBatchGroup = (group: BatchRevokeDayGroup): boolean => !group.isTestnet && group.sponsor === null;

interface RevenuePayment {
  createdAt: string;
  confirmedAt: string | null;
  status: 'pending' | 'confirmed' | 'expired' | 'failed' | 'reversed' | 'refunded';
  chainId: number;
  planId: string;
  planName: string | null;
  tier: 'premium' | 'ultimate' | null;
  amountUsdCents: number;
}

interface BatchRevokeDayGroup {
  day: string;
  chainId: number;
  sponsor: string | null;
  isTestnet: boolean;
  batchCount: number;
  feeUsdCents: number;
}

export interface RevenueData {
  payments: RevenuePayment[];
  batchRevokeGroups: BatchRevokeDayGroup[];
}

export interface FeeRecord {
  chainId: number;
  feeTransactionHash: string | null;
  feeUsdCents: number;
  vatRegion: string | null;
  timestamp: Date;
}

export interface RegionSummary {
  region: string;
  regionCode: string;
  revenue: number;
  vatRate: number;
  vatAmount: number;
}

// EU member state VAT rates (2025/2026 standard rates)
export const EU_VAT_RATES: Record<string, { name: string; rate: number }> = {
  AT: { name: 'Austria', rate: 0.2 },
  BE: { name: 'Belgium', rate: 0.21 },
  BG: { name: 'Bulgaria', rate: 0.2 },
  HR: { name: 'Croatia', rate: 0.25 },
  CY: { name: 'Cyprus', rate: 0.19 },
  CZ: { name: 'Czechia', rate: 0.21 },
  DK: { name: 'Denmark', rate: 0.25 },
  EE: { name: 'Estonia', rate: 0.24 },
  FI: { name: 'Finland', rate: 0.255 },
  FR: { name: 'France', rate: 0.2 },
  DE: { name: 'Germany', rate: 0.19 },
  GR: { name: 'Greece', rate: 0.24 },
  HU: { name: 'Hungary', rate: 0.27 },
  IE: { name: 'Ireland', rate: 0.23 },
  IT: { name: 'Italy', rate: 0.22 },
  LV: { name: 'Latvia', rate: 0.21 },
  LT: { name: 'Lithuania', rate: 0.21 },
  LU: { name: 'Luxembourg', rate: 0.17 },
  MT: { name: 'Malta', rate: 0.18 },
  NL: { name: 'Netherlands', rate: 0.21 },
  PL: { name: 'Poland', rate: 0.23 },
  PT: { name: 'Portugal', rate: 0.23 },
  RO: { name: 'Romania', rate: 0.21 },
  SK: { name: 'Slovakia', rate: 0.23 },
  SI: { name: 'Slovenia', rate: 0.22 },
  ES: { name: 'Spain', rate: 0.21 },
  SE: { name: 'Sweden', rate: 0.25 },
};

export const formatVatRate = (rate: number): string => `${Number((rate * 100).toFixed(1))}%`;

export const buildVatSummary = (records: FeeRecord[]): RegionSummary[] => {
  const revenueByRegion = new Map<string, number>();
  for (const record of records) {
    const region = record.vatRegion?.trim().toUpperCase() ?? 'UNKNOWN';
    revenueByRegion.set(region, (revenueByRegion.get(region) ?? 0) + record.feeUsdCents);
  }

  const rows: RegionSummary[] = [];

  for (const [code, { name, rate }] of Object.entries(EU_VAT_RATES)) {
    const revenue = revenueByRegion.get(code) ?? 0;
    rows.push({
      region: `${name} (${code})`,
      regionCode: code,
      revenue,
      vatRate: rate,
      vatAmount: Math.round((revenue * rate) / (1 + rate)),
    });
  }

  const restRevenue = [...revenueByRegion.entries()]
    .filter(([code]) => !(code in EU_VAT_RATES))
    .reduce((sum, [, revenue]) => sum + revenue, 0);
  rows.push({
    region: 'Rest of the world',
    regionCode: 'ROW',
    revenue: restRevenue,
    vatRate: 0,
    vatAmount: 0,
  });

  return rows;
};

export interface MonthlyRevenuePoint {
  month: string;
  subscriptionsUsdCents: number;
  batchRevokesUsdCents: number;
}

export const deriveMonthlySeries = (data: RevenueData, months: number): MonthlyRevenuePoint[] => {
  const subscriptionsByMonth = new Map<string, number>();
  for (const payment of data.payments.filter(isRevenueEligiblePayment)) {
    const month = payment.confirmedAt.slice(0, 7);
    subscriptionsByMonth.set(month, (subscriptionsByMonth.get(month) ?? 0) + payment.amountUsdCents);
  }

  const batchRevokesByMonth = new Map<string, number>();
  for (const group of data.batchRevokeGroups.filter(isRevenueEligibleBatchGroup)) {
    const month = group.day.slice(0, 7);
    batchRevokesByMonth.set(month, (batchRevokesByMonth.get(month) ?? 0) + group.feeUsdCents);
  }

  return listUtcMonths(months).map((month) => ({
    month,
    subscriptionsUsdCents: subscriptionsByMonth.get(month) ?? 0,
    batchRevokesUsdCents: batchRevokesByMonth.get(month) ?? 0,
  }));
};

interface RevenueTotals {
  subscriptionsUsdCents: number;
  batchRevokesUsdCents: number;
}

export const deriveTotals = (data: RevenueData, fromIso: string, toExclusiveIso: string): RevenueTotals => {
  const subscriptionsUsdCents = paymentsInWindow(data, fromIso, toExclusiveIso).reduce(
    (total, payment) => total + payment.amountUsdCents,
    0,
  );
  const batchRevokesUsdCents = batchGroupsInWindow(data, fromIso, toExclusiveIso).reduce(
    (total, group) => total + group.feeUsdCents,
    0,
  );

  return { subscriptionsUsdCents, batchRevokesUsdCents };
};

export interface ChainRevenue {
  chainId: number;
  subscriptionsUsdCents: number;
  batchRevokesUsdCents: number;
}

export const deriveByChain = (data: RevenueData, fromIso: string, toExclusiveIso: string): ChainRevenue[] => {
  const byChain = new Map<number, ChainRevenue>();
  const entryForChain = (chainId: number): ChainRevenue => {
    const entry = byChain.get(chainId) ?? { chainId, subscriptionsUsdCents: 0, batchRevokesUsdCents: 0 };
    byChain.set(chainId, entry);
    return entry;
  };

  for (const payment of paymentsInWindow(data, fromIso, toExclusiveIso)) {
    entryForChain(payment.chainId).subscriptionsUsdCents += payment.amountUsdCents;
  }
  for (const group of batchGroupsInWindow(data, fromIso, toExclusiveIso)) {
    entryForChain(group.chainId).batchRevokesUsdCents += group.feeUsdCents;
  }

  return [...byChain.values()].sort(
    (a, b) => b.subscriptionsUsdCents + b.batchRevokesUsdCents - (a.subscriptionsUsdCents + a.batchRevokesUsdCents),
  );
};

export interface PlanRevenue {
  planId: string;
  planName: string | null;
  paymentCount: number;
  totalUsdCents: number;
}

export const deriveByPlan = (data: RevenueData, fromIso: string, toExclusiveIso: string): PlanRevenue[] => {
  const byPlan = new Map<string, PlanRevenue>();
  for (const payment of paymentsInWindow(data, fromIso, toExclusiveIso)) {
    const entry = byPlan.get(payment.planId) ?? {
      planId: payment.planId,
      planName: null,
      paymentCount: 0,
      totalUsdCents: 0,
    };
    entry.planName = entry.planName ?? payment.planName;
    entry.paymentCount += 1;
    entry.totalUsdCents += payment.amountUsdCents;
    byPlan.set(payment.planId, entry);
  }

  return [...byPlan.values()].sort((a, b) => b.totalUsdCents - a.totalUsdCents);
};

// The payments table is both quote and payment (pending rows are short-lived quotes), so status
// counts by quote month form a conversion funnel. All statuses count here, not just confirmed.
export interface PaymentFunnelPoint {
  month: string;
  pending: number;
  confirmed: number;
  expired: number;
  failed: number;
  reversed: number;
  refunded: number;
}

export const deriveFunnel = (data: RevenueData, months: number): PaymentFunnelPoint[] => {
  const pointsByMonth = new Map<string, PaymentFunnelPoint>(
    listUtcMonths(months).map((month) => [
      month,
      { month, pending: 0, confirmed: 0, expired: 0, failed: 0, reversed: 0, refunded: 0 },
    ]),
  );

  for (const payment of data.payments) {
    const point = pointsByMonth.get(payment.createdAt.slice(0, 7));
    if (point) point[payment.status] += 1;
  }

  return [...pointsByMonth.values()];
};

// Batch revoke usage split: paid fees vs waived (premium) vs sponsored chains, per month.
// Only testnets are excluded; sponsored batches get their own buckets.
interface BatchRevokeSplitPoint {
  month: string;
  sponsor: string | null;
  batchCount: number;
  feeUsdCents: number;
}

export const deriveSponsorSplit = (data: RevenueData, months: number): BatchRevokeSplitPoint[] => {
  const windowMonths = new Set(listUtcMonths(months));

  const byMonthAndSponsor = new Map<string, BatchRevokeSplitPoint>();
  for (const group of data.batchRevokeGroups) {
    const month = group.day.slice(0, 7);
    if (group.isTestnet || !windowMonths.has(month)) continue;

    const key = `${month}|${group.sponsor ?? ''}`;
    const point = byMonthAndSponsor.get(key) ?? { month, sponsor: group.sponsor, batchCount: 0, feeUsdCents: 0 };
    point.batchCount += group.batchCount;
    point.feeUsdCents += group.feeUsdCents;
    byMonthAndSponsor.set(key, point);
  }

  return [...byMonthAndSponsor.values()];
};

export const utcMonthStartIso = (monthsAgo: number = 0): string => {
  return startOfUtcMonthsAgo(monthsAgo).toISOString();
};

export const startOfUtcMonthsAgo = (monthsAgo: number): Date => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsAgo, 1));
};

const paymentsInWindow = (data: RevenueData, fromIso: string, toExclusiveIso: string) => {
  const fromMs = Date.parse(fromIso);
  const toExclusiveMs = Date.parse(toExclusiveIso);
  return data.payments.filter(isRevenueEligiblePayment).filter((payment) => {
    const confirmedAtMs = Date.parse(payment.confirmedAt);
    return confirmedAtMs >= fromMs && confirmedAtMs < toExclusiveMs;
  });
};

// Batch groups are day-granular; a group is in the window when the start of its UTC day is
const batchGroupsInWindow = (data: RevenueData, fromIso: string, toExclusiveIso: string) => {
  const fromMs = Date.parse(fromIso);
  const toExclusiveMs = Date.parse(toExclusiveIso);
  return data.batchRevokeGroups.filter(isRevenueEligibleBatchGroup).filter((group) => {
    const dayStartMs = Date.parse(`${group.day}T00:00:00.000Z`);
    return dayStartMs >= fromMs && dayStartMs < toExclusiveMs;
  });
};

// The last `months` UTC months as 'YYYY-MM' strings, oldest first, ending with the current month
const listUtcMonths = (months: number): string[] =>
  Array.from({ length: months }, (_, index) =>
    startOfUtcMonthsAgo(months - 1 - index)
      .toISOString()
      .slice(0, 7),
  );
