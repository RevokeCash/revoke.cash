import { getGasSpendReport } from '@revoke.cash/core/admin/gas-spend';
import { periodQuerySchema, toUtcPeriod } from 'lib/admin/period';
import { handleAdminRead } from 'lib/api/admin';
import { parseRequest } from 'lib/api/validation';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

const schemas = {
  params: z.undefined(),
  body: z.undefined(),
  query: periodQuerySchema,
};

export async function GET(req: NextRequest) {
  const handler = async () => {
    const { query } = await parseRequest(req, undefined, schemas);
    const { from, to } = toUtcPeriod(query.from, query.to);
    return getGasSpendReport(from, to);
  };

  return handleAdminRead(req, handler);
}
