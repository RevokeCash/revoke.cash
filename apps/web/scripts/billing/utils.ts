import { getDb } from '@revoke.cash/core/db/client';
import { batchRevokes } from '@revoke.cash/core/db/schema/batch-revokes';
import { premiumPayments } from '@revoke.cash/core/db/schema/premium';
import { formatFiatAmount } from '@revoke.cash/core/utils/formatting';
import { and, asc, eq, gte, isNotNull, isNull, lt } from 'drizzle-orm';

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

export const EU_COUNTRY_CODES = new Set(Object.keys(EU_VAT_RATES));

export interface FeeRecord {
  chainId: number;
  feeTransactionHash: string | null;
  feePaid: number; // cents
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

export const fetchBatchRevokeFeeRecords = async (from: Date, to: Date): Promise<FeeRecord[]> => {
  const toExclusive = new Date(to.getTime() + 1);

  const records = await getDb().query.batchRevokes.findMany({
    where: and(
      gte(batchRevokes.timestamp, from),
      lt(batchRevokes.timestamp, toExclusive),
      eq(batchRevokes.isTestnet, false),
      isNull(batchRevokes.sponsor),
    ),
    orderBy: asc(batchRevokes.timestamp),
  });

  return records.filter((r) => r.feePaid > 0);
};

export const fetchPremiumFeeRecords = async (from: Date, to: Date): Promise<FeeRecord[]> => {
  const toExclusive = new Date(to.getTime() + 1);

  const records = await getDb().query.premiumPayments.findMany({
    where: and(
      eq(premiumPayments.status, 'confirmed'),
      isNotNull(premiumPayments.confirmedAt),
      gte(premiumPayments.confirmedAt, from),
      lt(premiumPayments.confirmedAt, toExclusive),
    ),
    orderBy: asc(premiumPayments.confirmedAt),
  });

  return records
    .filter((r) => r.amountUsd > 0 && r.confirmedAt !== null)
    .map((r) => ({
      chainId: r.chainId,
      feeTransactionHash: r.matchedTxHash,
      feePaid: r.amountUsd,
      vatRegion: r.vatRegion,
      timestamp: r.confirmedAt!,
    }));
};

export const buildVatSummary = (records: FeeRecord[]): RegionSummary[] => {
  const revenueByRegion = new Map<string, number>();
  for (const record of records) {
    const region = record.vatRegion?.trim().toUpperCase() ?? 'UNKNOWN';
    revenueByRegion.set(region, (revenueByRegion.get(region) ?? 0) + record.feePaid);
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

  let restRevenue = 0;
  for (const [code, revenue] of revenueByRegion) {
    if (!EU_COUNTRY_CODES.has(code)) {
      restRevenue += revenue;
    }
  }
  rows.push({
    region: 'Rest of the world',
    regionCode: 'ROW',
    revenue: restRevenue,
    vatRate: 0,
    vatAmount: 0,
  });

  return rows;
};

export const formatUsd = (cents: number): string => {
  return formatFiatAmount(cents / 100) ?? '$0.00';
};

export const formatDate = (date: Date): string => {
  return date
    .toISOString()
    .replace('T', ' ')
    .replace(/\.\d{3}Z$/, ' UTC');
};

export const formatPercent = (rate: number): string => {
  return `${(rate * 100).toFixed(rate * 100 === Math.floor(rate * 100) ? 0 : 1)}%`;
};

export const formatPeriodLabel = (from: Date, to: Date): string => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fromMonth = months[from.getUTCMonth()];
  const toMonth = months[to.getUTCMonth()];
  const year = from.getUTCFullYear();
  return `${fromMonth} ${from.getUTCDate()} – ${toMonth} ${to.getUTCDate()}, ${year}`;
};

export const parseDateRangeArgs = (args: string[]): { from: Date; to: Date } => {
  let fromStr: string | undefined;
  let toStr: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--from' && args[i + 1]) fromStr = args[++i];
    if (args[i] === '--to' && args[i + 1]) toStr = args[++i];
  }

  if (!fromStr || !toStr) {
    throw new Error(`Usage: --from YYYY-MM-DD --to YYYY-MM-DD`);
  }

  const from = new Date(`${fromStr}T00:00:00.000Z`);
  const to = new Date(`${toStr}T23:59:59.999Z`);

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    throw new Error('Invalid date format. Use YYYY-MM-DD.');
  }

  return { from, to };
};
