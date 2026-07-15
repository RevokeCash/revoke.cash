import { reverifyRecentPayments } from '@revoke.cash/core/premium/reverify-payments';
import { reconcilePendingPayments } from '@revoke.cash/core/premium/verify-payment';
import { requireCronSecret } from 'lib/api/auth';
import { handleApiRouteError } from 'lib/api/errors';
import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    requireCronSecret(req);
    const reconciliation = await reconcilePendingPayments(100);
    const reverification = await reverifyRecentPayments();
    return NextResponse.json({ reconciliation, reverification }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return handleApiRouteError(error, { errorMessage: 'Failed to reconcile payments' });
  }
}
