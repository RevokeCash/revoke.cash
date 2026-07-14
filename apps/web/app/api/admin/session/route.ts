import { isAdminSession, RateLimiters, requireRateLimit } from 'lib/api/auth';
import { handleApiRouteError } from 'lib/api/errors';
import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// Unlike the other admin routes, this one never throws for non-admins: the admin shell uses it
// to decide between the sign-in view and the dashboard.
export async function GET(req: NextRequest) {
  try {
    await requireRateLimit(req, RateLimiters.PREMIUM_READ);
    const isAdmin = await isAdminSession(req);

    return NextResponse.json({ isAdmin }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return handleApiRouteError(error);
  }
}
