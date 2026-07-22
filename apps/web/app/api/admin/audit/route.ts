import { getAdminAuditEvents } from '@revoke.cash/core/admin/audit';
import { AUDIT_ACTIONS } from '@revoke.cash/core/audit/actions';
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
    actions: commaSeparatedList.pipe(z.array(z.enum(AUDIT_ACTIONS)).optional()),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(25),
  }),
};

export const runtime = 'edge';
export const preferredRegion = ['iad1'];

export async function GET(req: NextRequest) {
  const handler = async () => {
    const { query } = await parseRequest(req, undefined, schemas);
    return getAdminAuditEvents(query);
  };

  return handleAdminRead(req, handler, 'Failed to fetch audit events');
}
