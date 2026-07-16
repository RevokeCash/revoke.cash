import { getPremiumPlans } from '@revoke.cash/core/premium/plans';
import { handleApiRouteError } from 'lib/api/errors';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const plans = await getPremiumPlans();

    return NextResponse.json(
      { plans },
      {
        headers: {
          'Cache-Control': `max-age=${60 * 5}`,
          'Vercel-CDN-Cache-Control': `s-maxage=${60 * 60}`,
        },
      },
    );
  } catch (error) {
    return handleApiRouteError(error, { errorMessage: 'Failed to load plans' });
  }
}
