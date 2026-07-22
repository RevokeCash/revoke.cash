import { getMonthlyBudget } from '@revoke.cash/core/auto-revoke/execution/budget';
import { handleAdminRead } from 'lib/api/admin';
import { parseRequest } from 'lib/api/validation';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

interface Props {
  params: Promise<{ id: string }>;
}

const schemas = {
  params: z.object({ id: z.uuid() }),
  body: z.undefined(),
};

export const runtime = 'edge';
export const preferredRegion = ['iad1'];

export async function GET(req: NextRequest, props: Props) {
  const handler = async () => {
    const { params } = await parseRequest(req, props, schemas);
    return getMonthlyBudget(params.id);
  };

  return handleAdminRead(req, handler);
}
