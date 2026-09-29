import { buildVatSummary } from '@revoke.cash/core/admin/revenue';
import { fetchBatchRevokeFeeRecords, fetchPremiumFeeRecords } from '@revoke.cash/core/admin/revenue-queries';
import { generatePdf } from 'lib/admin/invoice';
import { getPrintedEndDate, toUtcPeriod } from 'lib/admin/period';
import { authorizeRequest, RateLimiters } from 'lib/api/auth';
import { handleApiRouteError } from 'lib/api/errors';
import { parseRequest } from 'lib/api/validation';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const schemas = {
  params: z.undefined(),
  body: z.undefined(),
  query: z.object({
    stream: z.enum(['premium', 'batch_revokes']),
    from: z.iso.date(),
    to: z.iso.date(),
  }),
};

const STREAM_CONFIG = {
  premium: { title: 'Revoke Premium Payments', filePrefix: 'premium', fetchRecords: fetchPremiumFeeRecords },
  batch_revokes: { title: 'Batch Revoke Fees', filePrefix: 'fees', fetchRecords: fetchBatchRevokeFeeRecords },
} as const;

export async function GET(req: NextRequest) {
  try {
    await authorizeRequest(req, { auth: 'siwe', requireAdmin: true, rateLimiter: RateLimiters.PREMIUM_READ });
    const { query } = await parseRequest(req, undefined, schemas);

    const { from, to } = toUtcPeriod(query.from, query.to);
    const printedEndDate = getPrintedEndDate(query.to);

    const { title, filePrefix, fetchRecords } = STREAM_CONFIG[query.stream];
    const records = await fetchRecords(from, to);
    const printedPeriod = toUtcPeriod(query.from, printedEndDate);
    const pdf = await generatePdf({ title, records, summary: buildVatSummary(records), ...printedPeriod });

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filePrefix}-invoice-${query.from}-to-${printedEndDate}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return handleApiRouteError(error, { errorMessage: 'Failed to generate invoice' });
  }
}
