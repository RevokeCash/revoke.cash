import { getFeeReconciliation } from '@revoke.cash/core/admin/fee-reconciliation';
import { periodQuerySchema, toUtcPeriod } from 'lib/admin/period';
import { handleAdminRead } from 'lib/api/admin';
import { parseRequest } from 'lib/api/validation';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

export const maxDuration = 60;

const schemas = {
  params: z.undefined(),
  body: z.undefined(),
  query: periodQuerySchema,
};

export async function GET(req: NextRequest) {
  const handler = async () => {
    const { query } = await parseRequest(req, undefined, schemas);
    const { from, to } = toUtcPeriod(query.from, query.to);
    return getFeeReconciliation(from, to);
  };

  return handleAdminRead(req, handler, 'Failed to load fee reconciliation');
}
