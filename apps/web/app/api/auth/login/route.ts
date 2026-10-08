import { requireSameOrigin, storeSession } from 'lib/api/auth';
import { handleApiRouteError } from 'lib/api/errors';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    requireSameOrigin(req);
    const res = NextResponse.json({ ok: true });
    await storeSession(req, res);
    return res;
  } catch (error) {
    return handleApiRouteError(error);
  }
}
