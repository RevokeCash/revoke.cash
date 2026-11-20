import { processIncomingTransfers } from '@revoke.cash/core/premium/incoming-transfers';
import { reverifyRecentPayments } from '@revoke.cash/core/premium/reverify-payments';
import { requireCronSecret } from 'lib/api/auth';
import { handleApiRouteError } from 'lib/api/errors';
import { type NextRequest, NextResponse } from 'next/server';

// Runs two sequential phases, each with per-chain RPC calls; a slow RPC must not truncate the run
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  try {
    requireCronSecret(req);
    const incomingTransfers = await processIncomingTransfers();
    const reverification = await reverifyRecentPayments();
    return NextResponse.json({ incomingTransfers, reverification }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return handleApiRouteError(error, { errorMessage: 'Failed to reconcile payments' });
  }
}
