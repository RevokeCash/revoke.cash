import { destroySessionsEdge } from 'lib/api/auth';
import { handleApiRouteError } from 'lib/api/errors';
import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const res = NextResponse.json({ ok: true });
    await destroySessionsEdge(req, res);
    return res;
  } catch (error) {
    return handleApiRouteError(error);
  }
}
