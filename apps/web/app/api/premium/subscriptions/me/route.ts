import { getGrantedEntitlements } from '@revoke.cash/core/premium/entitlements';
import { getOwnerSubscriptions } from '@revoke.cash/core/premium/subscriptions';
import { authorizeRequest, RateLimiters } from 'lib/api/auth';
import { handleApiRouteError } from 'lib/api/errors';
import { parseRequest } from 'lib/api/validation';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'edge';

const schemas = {
  params: z.undefined(),
  body: z.undefined(),
};

export async function GET(req: NextRequest) {
  try {
    const { siweAddress } = await authorizeRequest(req, {
      auth: 'siwe',
      rateLimiter: RateLimiters.PREMIUM_READ,
    });
    await parseRequest(req, undefined, schemas);
    try {
      const [subscriptions, entitlements] = await Promise.all([
        getOwnerSubscriptions(siweAddress),
        getGrantedEntitlements(siweAddress),
      ]);

      return NextResponse.json({ subscriptions, entitlements }, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
      return handleApiRouteError(error, { errorMessage: 'Failed to load subscriptions' });
    }
  } catch (error) {
    return handleApiRouteError(error);
  }
}
