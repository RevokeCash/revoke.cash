import { reconcilePendingPayments } from '@revoke.cash/core/premium/verify-payment';
import { requireCronSecret } from 'lib/api/auth';
import { handleApiRouteError } from 'lib/api/errors';
import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    requireCronSecret(req);
    const result = await reconcilePendingPayments(100);
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return handleApiRouteError(error, { errorMessage: 'Failed to reconcile payments', exposeErrorMessage: false });
  }
}
