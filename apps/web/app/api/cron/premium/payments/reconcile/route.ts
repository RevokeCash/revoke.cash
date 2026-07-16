import { reverifyRecentPayments } from '@revoke.cash/core/premium/reverify-payments';
import { settleIncomingTransfers } from '@revoke.cash/core/premium/settle-incoming-transfers';
import { reconcilePendingPayments } from '@revoke.cash/core/premium/verify-payment';
import { requireCronSecret } from 'lib/api/auth';
import { handleApiRouteError } from 'lib/api/errors';
import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Runs three sequential phases, each with per-chain RPC calls; a slow RPC must not truncate the run
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  try {
    requireCronSecret(req);
    const reconciliation = await reconcilePendingPayments(100);
    const incomingTransfers = await settleIncomingTransfers();
    const reverification = await reverifyRecentPayments();
    return NextResponse.json(
      { reconciliation, incomingTransfers, reverification },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    return handleApiRouteError(error, { errorMessage: 'Failed to reconcile payments' });
  }
}
