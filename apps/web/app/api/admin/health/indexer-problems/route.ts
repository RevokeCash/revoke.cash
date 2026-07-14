import { getIndexerProblemRows } from '@revoke.cash/core/admin/health';
import { handleAdminRead } from 'lib/api/admin';
import { parseRequest } from 'lib/api/validation';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

const schemas = {
  params: z.undefined(),
  body: z.undefined(),
  query: z.object({
    kind: z.enum(['disabled', 'failing']),
  }),
};

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const handler = async () => {
    const { query } = await parseRequest(req, undefined, schemas);
    return getIndexerProblemRows(query.kind);
  };

  return handleAdminRead(req, handler);
}
