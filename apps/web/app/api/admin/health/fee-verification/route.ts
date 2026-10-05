import { getFeeVerificationProblemRows } from '@revoke.cash/core/admin/health';
import { handleAdminRead } from 'lib/api/admin';
import { parseRequest } from 'lib/api/validation';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

const schemas = {
  params: z.undefined(),
  body: z.undefined(),
  query: z.object({
    kind: z.enum(['pending', 'failed']),
  }),
};

export async function GET(req: NextRequest) {
  const handler = async () => {
    const { query } = await parseRequest(req, undefined, schemas);
    return getFeeVerificationProblemRows(query.kind);
  };

  return handleAdminRead(req, handler);
}
