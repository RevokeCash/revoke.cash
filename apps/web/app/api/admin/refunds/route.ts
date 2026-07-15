import { getPendingRefundRequests } from '@revoke.cash/core/premium/refunds';
import { handleAdminRead } from 'lib/api/admin';
import type { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  return handleAdminRead(req, () => getPendingRefundRequests(), 'Failed to fetch refund requests');
}
