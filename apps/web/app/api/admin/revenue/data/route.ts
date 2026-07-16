import { getRevenueData } from '@revoke.cash/core/admin/revenue-queries';
import { handleAdminRead } from 'lib/api/admin';
import { parseRequest } from 'lib/api/validation';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

const schemas = {
  params: z.undefined(),
  body: z.undefined(),
  query: z.object({ months: z.coerce.number().int().min(1).max(36).default(12) }),
};

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const handler = async () => {
    const { query } = await parseRequest(req, undefined, schemas);
    return getRevenueData(query.months);
  };

  return handleAdminRead(req, handler);
}
