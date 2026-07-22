import { getAddressActivity } from '@revoke.cash/core/auto-revoke/activity';
import { authorizeRequest, RateLimiters } from 'lib/api/auth';
import { handleApiRouteError } from 'lib/api/errors';
import { parseRequest } from 'lib/api/validation';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const schemas = {
  params: z.undefined(),
  body: z.undefined(),
};

export const runtime = 'edge';
export const preferredRegion = ['iad1'];

export async function GET(req: NextRequest) {
  try {
    const { siweAddress } = await authorizeRequest(req, {
      auth: 'siwe',
      rateLimiter: RateLimiters.PREMIUM_READ,
    });
    await parseRequest(req, undefined, schemas);

    const activity = await getAddressActivity(siweAddress);
    return NextResponse.json(activity);
  } catch (error) {
    return handleApiRouteError(error, { errorMessage: 'Failed to fetch activity' });
  }
}
