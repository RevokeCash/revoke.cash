import { storeSiweNonceCookieEdge } from 'lib/api/auth';
import { handleApiRouteError } from 'lib/api/errors';
import { type NextRequest, NextResponse } from 'next/server';
import { generateSiweNonce } from 'viem/siwe';

export const runtime = 'edge';

// Issues a server-generated SIWE nonce, bound to the requesting browser through a short-lived
// sealed cookie. The verify route only accepts messages carrying the nonce from this cookie.
export async function GET(req: NextRequest) {
  try {
    const nonce = generateSiweNonce();

    const res = NextResponse.json({ nonce }, { headers: { 'Cache-Control': 'no-store' } });
    await storeSiweNonceCookieEdge(req, res, nonce);
    return res;
  } catch (error) {
    return handleApiRouteError(error);
  }
}
