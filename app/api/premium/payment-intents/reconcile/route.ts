import { checkRateLimitAllowedEdge, RateLimiters } from 'lib/api/auth';
import { getPremiumApiKeyFromHeaders, hasPremiumApiKeyAccess } from 'lib/premium/api-keys';
import { reconcilePendingPaymentIntents } from 'lib/premium/verify-payment';
import { type NextRequest, NextResponse } from 'next/server';

interface RequestBody {
  limit?: number;
}

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const apiKey = getPremiumApiKeyFromHeaders(req.headers);
  const hasAccess = await hasPremiumApiKeyAccess(apiKey, 'reconcile');

  if (!hasAccess) {
    return NextResponse.json({ message: 'Missing or invalid Authorization Bearer token' }, { status: 403 });
  }

  if (!(await checkRateLimitAllowedEdge(req, RateLimiters.PREMIUM_WRITE))) {
    return NextResponse.json({ message: 'Too many requests, please try again later.' }, { status: 429 });
  }

  const body = (await req.json()) as RequestBody;
  const requestedLimit = typeof body.limit === 'number' ? body.limit : 20;

  try {
    const result = await reconcilePendingPaymentIntents(requestedLimit);
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error reconciling payment intents', error);

    return NextResponse.json({ message: 'Failed to reconcile payment intents' }, { status: 500 });
  }
}
