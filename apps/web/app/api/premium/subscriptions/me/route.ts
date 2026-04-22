import { getGrantedEntitlements } from '@revoke.cash/core/premium/entitlements';
import { getOwnerSubscriptions } from '@revoke.cash/core/premium/subscriptions';
import { checkRateLimitAllowedEdge, getAuthenticatedSiweAddress, RateLimiters } from 'lib/api/auth';
import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const siweAddress = await getAuthenticatedSiweAddress(req);
  if (!siweAddress) {
    return NextResponse.json({ message: 'No SIWE session is active' }, { status: 403 });
  }

  if (!(await checkRateLimitAllowedEdge(req, RateLimiters.PREMIUM_READ))) {
    return NextResponse.json({ message: 'Too many requests, please try again later.' }, { status: 429 });
  }

  try {
    const [subscriptions, entitlements] = await Promise.all([
      getOwnerSubscriptions(siweAddress),
      getGrantedEntitlements(siweAddress),
    ]);

    return NextResponse.json({ subscriptions, entitlements }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Error loading premium subscriptions', error);

    return NextResponse.json({ message: 'Failed to load subscriptions' }, { status: 500 });
  }
}
