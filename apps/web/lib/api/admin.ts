import { authorizeRequest, RateLimiters } from 'lib/api/auth';
import { handleApiRouteError } from 'lib/api/errors';
import { type NextRequest, NextResponse } from 'next/server';

export const handleAdminRead = async (
  req: NextRequest,
  handler: () => Promise<unknown>,
  errorMessage?: string,
): Promise<NextResponse> => {
  try {
    await authorizeRequest(req, { auth: 'siwe', requireAdmin: true, rateLimiter: RateLimiters.PREMIUM_READ });
    return NextResponse.json(await handler(), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return handleApiRouteError(error, { errorMessage });
  }
};

export const handleAdminWrite = async (
  req: NextRequest,
  handler: () => Promise<unknown>,
  errorMessage?: string,
): Promise<NextResponse> => {
  try {
    await authorizeRequest(req, { auth: 'siwe', requireAdmin: true, rateLimiter: RateLimiters.PREMIUM_WRITE });
    return NextResponse.json(await handler(), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return handleApiRouteError(error, { errorMessage });
  }
};
