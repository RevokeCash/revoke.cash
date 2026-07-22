import { getAdminActivity } from '@revoke.cash/core/admin/activity';
import { autoRevokeActionStatusEnum } from '@revoke.cash/core/db/schema/auto-revoke';
import { addressSchema } from '@revoke.cash/core/schemas';
import { handleAdminRead } from 'lib/api/admin';
import { parseRequest } from 'lib/api/validation';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

const commaSeparatedList = z
  .string()
  .optional()
  .transform((value) => (value === undefined || value === '' ? undefined : value.split(',')));

const schemas = {
  params: z.undefined(),
  body: z.undefined(),
  query: z.object({
    address: addressSchema.optional(),
    subscriptionId: z.uuid().optional(),
    chainIds: commaSeparatedList
      .transform((chainIds) => chainIds?.map(Number))
      .pipe(z.array(z.number().int().positive()).optional()),
    statuses: commaSeparatedList.pipe(z.array(z.enum(autoRevokeActionStatusEnum.enumValues)).optional()),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(25),
  }),
};

export const runtime = 'edge';
export const preferredRegion = ['iad1'];

export async function GET(req: NextRequest) {
  const handler = async () => {
    const { query } = await parseRequest(req, undefined, schemas);
    return getAdminActivity(query);
  };

  return handleAdminRead(req, handler, 'Failed to fetch admin activity');
}
