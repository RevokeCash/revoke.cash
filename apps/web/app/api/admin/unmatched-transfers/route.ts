import { getUnmatchedTransfers } from '@revoke.cash/core/premium/unmatched-transfers';
import { handleAdminRead } from 'lib/api/admin';
import type { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  return handleAdminRead(req, () => getUnmatchedTransfers(), 'Failed to fetch unmatched transfers');
}
