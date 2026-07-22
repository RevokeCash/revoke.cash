import { getAdminSubscriptions } from '@revoke.cash/core/admin/subscriptions';
import { addressSchema } from '@revoke.cash/core/schemas';
import { handleAdminRead } from 'lib/api/admin';
import { parseRequest } from 'lib/api/validation';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

const schemas = {
  params: z.undefined(),
  body: z.undefined(),
  query: z.object({
    filter: z.enum(['all', 'active', 'expiring', 'expired', 'anomaly']).default('all'),
    owner: addressSchema.optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(25),
  }),
};

export const runtime = 'edge';
export const preferredRegion = ['iad1'];

export async function GET(req: NextRequest) {
  const handler = async () => {
    const { query } = await parseRequest(req, undefined, schemas);

    return getAdminSubscriptions({
      filter: query.filter,
      ownerAddress: query.owner,
      page: query.page,
      pageSize: query.pageSize,
    });
  };

  return handleAdminRead(req, handler);
}
