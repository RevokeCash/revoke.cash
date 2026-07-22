import { buildVatSummary, type FeeRecord } from '@revoke.cash/core/admin/revenue';
import { fetchBatchRevokeFeeRecords, fetchPremiumFeeRecords } from '@revoke.cash/core/admin/revenue-queries';
import { authorizeRequest, RateLimiters } from 'lib/api/auth';
import { handleApiRouteError } from 'lib/api/errors';
import { parseRequest } from 'lib/api/validation';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const schemas = {
  params: z.undefined(),
  body: z.undefined(),
  query: z.object({
    from: z.iso.date(),
    to: z.iso.date(),
    format: z.enum(['json', 'csv']).default('json'),
  }),
};

export const runtime = 'edge';
export const preferredRegion = ['iad1'];

export async function GET(req: NextRequest) {
  try {
    await authorizeRequest(req, { auth: 'siwe', requireAdmin: true, rateLimiter: RateLimiters.PREMIUM_READ });
    const { query } = await parseRequest(req, undefined, schemas);

    const from = new Date(`${query.from}T00:00:00.000Z`);
    const toInclusive = new Date(`${query.to}T23:59:59.999Z`);

    const [premiumRecords, batchRevokeRecords] = await Promise.all([
      fetchPremiumFeeRecords(from, toInclusive),
      fetchBatchRevokeFeeRecords(from, toInclusive),
    ]);

    if (query.format === 'csv') {
      const csv = buildVatCsv(premiumRecords, batchRevokeRecords);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="revenue-${query.from}-${query.to}.csv"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    return NextResponse.json(
      {
        premium: { recordCount: premiumRecords.length, summary: buildVatSummary(premiumRecords) },
        batchRevokes: { recordCount: batchRevokeRecords.length, summary: buildVatSummary(batchRevokeRecords) },
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    return handleApiRouteError(error);
  }
}

const buildVatCsv = (premiumRecords: FeeRecord[], batchRevokeRecords: FeeRecord[]): string => {
  const labeledRecords = [
    ...premiumRecords.map((record) => ({ stream: 'premium', record })),
    ...batchRevokeRecords.map((record) => ({ stream: 'batch_revoke', record })),
  ].sort((a, b) => a.record.timestamp.getTime() - b.record.timestamp.getTime());

  const header = 'stream,timestamp,chainId,txHash,vatRegion,feeUsdCents';
  const rows = labeledRecords.map(({ stream, record }) =>
    [
      stream,
      record.timestamp.toISOString(),
      record.chainId,
      record.feeTransactionHash ?? '',
      record.vatRegion ?? '',
      record.feeUsdCents,
    ].join(','),
  );

  return [header, ...rows].join('\n');
};
