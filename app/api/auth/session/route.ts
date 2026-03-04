import { getAuthSessionByHeaders, getSiweCookieEdge, IRON_OPTIONS, storeSessionEdge } from 'lib/api/auth';
import { UNAUTHENTICATED_AUTH_SESSION } from 'lib/auth/session';
import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const sessionCookie = req.cookies.get(IRON_OPTIONS.cookieName)?.value;
  const session = await getAuthSessionByHeaders(req.headers, sessionCookie);

  const headers = { 'Cache-Control': 'no-store' };

  if (session.hasApiSession) {
    return NextResponse.json(session, { headers });
  }

  // Main session is missing or expired — try to restore from the long-lived SIWE cookie
  const siweData = await getSiweCookieEdge(req);

  if (!siweData?.address) {
    return NextResponse.json(UNAUTHENTICATED_AUTH_SESSION, { headers });
  }

  const restoredSession = { hasApiSession: true, siweAddress: siweData.address };
  const res = NextResponse.json(restoredSession, { headers });
  await storeSessionEdge(req, res, { siwe: siweData });
  return res;
}
