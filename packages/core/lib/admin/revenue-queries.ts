import {
  type FeeRecord,
  REVENUE_EXCLUDED_CHAIN_IDS,
  type RevenueData,
  startOfUtcMonthsAgo,
} from '@revoke.cash/core/admin/revenue';
import { getDb } from '@revoke.cash/core/db/client';
import { batchRevokes } from '@revoke.cash/core/db/schema/batch-revokes';
import { premiumPayments, premiumPlans } from '@revoke.cash/core/db/schema/premium';
import { and, asc, eq, gt, gte, isNotNull, isNull, lt, notInArray, or, type SQL, sql } from 'drizzle-orm';

// Database queries feeding the revenue policy and derivations in ./revenue. The SQL conditions
// below are the query-side expression of the eligibility rules defined there.

const batchRevokeRevenueConditions = (): SQL | undefined =>
  and(eq(batchRevokes.isTestnet, false), isNull(batchRevokes.sponsor), gt(batchRevokes.feeUsdCents, 0));

const premiumRevenueConditions = (): SQL | undefined =>
  and(
    eq(premiumPayments.status, 'confirmed'),
    isNotNull(premiumPayments.confirmedAt),
    gt(premiumPayments.amountUsdCents, 0),
    notInArray(premiumPayments.chainId, REVENUE_EXCLUDED_CHAIN_IDS),
  );

export const fetchBatchRevokeFeeRecords = async (from: Date, to: Date): Promise<FeeRecord[]> => {
  const toExclusive = new Date(to.getTime() + 1);

  const records = await getDb().query.batchRevokes.findMany({
    where: and(
      batchRevokeRevenueConditions(),
      gte(batchRevokes.timestamp, from),
      lt(batchRevokes.timestamp, toExclusive),
    ),
    orderBy: asc(batchRevokes.timestamp),
    columns: { chainId: true, feeTransactionHash: true, feeUsdCents: true, vatRegion: true, timestamp: true },
  });

  return records;
};

export const fetchPremiumFeeRecords = async (from: Date, to: Date): Promise<FeeRecord[]> => {
  const toExclusive = new Date(to.getTime() + 1);

  const records = await getDb().query.premiumPayments.findMany({
    where: and(
      premiumRevenueConditions(),
      gte(premiumPayments.confirmedAt, from),
      lt(premiumPayments.confirmedAt, toExclusive),
    ),
    orderBy: asc(premiumPayments.confirmedAt),
  });

  return records.map((record) => ({
    chainId: record.chainId,
    feeTransactionHash: record.matchedTxHash,
    feeUsdCents: record.amountUsdCents,
    vatRegion: record.vatRegion,
    timestamp: record.confirmedAt!,
  }));
};

// Unfiltered revenue source data for the admin dashboard; eligibility filtering, aggregation and
// month bucketing happen in the pure derivations in ./revenue.
export const getRevenueData = async (months: number): Promise<RevenueData> => {
  const db = getDb();
  const from = startOfUtcMonthsAgo(months - 1);

  // Days are bucketed on UTC wall-clock time so aggregates are stable regardless of session timezone
  const utcDayExpression = sql<string>`to_char(${batchRevokes.timestamp} at time zone 'UTC', 'YYYY-MM-DD')`;

  const [paymentRows, batchRevokeGroups] = await Promise.all([
    db
      .select({
        createdAt: premiumPayments.createdAt,
        confirmedAt: premiumPayments.confirmedAt,
        status: premiumPayments.status,
        chainId: premiumPayments.chainId,
        planId: premiumPayments.planId,
        planName: premiumPlans.name,
        tier: premiumPlans.tier,
        amountUsdCents: premiumPayments.amountUsdCents,
      })
      .from(premiumPayments)
      .leftJoin(
        premiumPlans,
        and(eq(premiumPayments.planId, premiumPlans.id), eq(premiumPayments.planVersion, premiumPlans.version)),
      )
      // Complimentary grants are not checkouts, so they are kept out of both the revenue
      // aggregates and the conversion funnel
      .where(
        and(
          isNull(premiumPayments.grantedBy),
          or(gte(premiumPayments.createdAt, from), gte(premiumPayments.confirmedAt, from)),
        ),
      ),
    db
      .select({
        day: utcDayExpression,
        chainId: batchRevokes.chainId,
        sponsor: batchRevokes.sponsor,
        isTestnet: batchRevokes.isTestnet,
        batchCount: sql<number>`count(*)::int`,
        feeUsdCents: sql<number>`coalesce(sum(${batchRevokes.feeUsdCents}), 0)::int`,
      })
      .from(batchRevokes)
      .where(gte(batchRevokes.timestamp, from))
      .groupBy(utcDayExpression, batchRevokes.chainId, batchRevokes.sponsor, batchRevokes.isTestnet),
  ]);

  const payments = paymentRows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
    confirmedAt: row.confirmedAt?.toISOString() ?? null,
  }));

  return { payments, batchRevokeGroups };
};
