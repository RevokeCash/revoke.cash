import { verifyBatchRevokeFeePayments } from '@revoke.cash/core/batch-revokes/verify-fee-payments';
import { requireCronSecret } from 'lib/api/auth';
import { handleApiRouteError } from 'lib/api/errors';
import { type NextRequest, NextResponse } from 'next/server';

// Each reported fee needs a few RPC calls; a slow RPC must not truncate the run
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  try {
    requireCronSecret(req);
    const verification = await verifyBatchRevokeFeePayments(100);
    return NextResponse.json(verification, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return handleApiRouteError(error, { errorMessage: 'Failed to verify batch revoke fee payments' });
  }
}
