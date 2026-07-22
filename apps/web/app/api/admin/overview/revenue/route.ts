import { getAnnualRunRate } from '@revoke.cash/core/admin/subscriptions';
import { handleAdminRead } from 'lib/api/admin';
import type { NextRequest } from 'next/server';

export const runtime = 'edge';
export const preferredRegion = ['iad1'];

export async function GET(req: NextRequest) {
  return handleAdminRead(req, async () => ({ runRate: await getAnnualRunRate() }));
}
