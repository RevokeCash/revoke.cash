import { storeSessionEdge } from 'lib/api/auth';
import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const res = new NextResponse(JSON.stringify({ ok: true }), { status: 200 });
  await storeSessionEdge(req, res);
  return res;
}
