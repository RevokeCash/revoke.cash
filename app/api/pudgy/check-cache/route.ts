import { RateLimiters, checkActiveSessionEdge, checkRateLimitAllowedEdge } from 'lib/api/auth';
import type { NextRequest } from 'next/server';
import { CACHE_KEY_PREFIX, PUDDY_CACHE } from '../constants';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  if (!(await checkActiveSessionEdge(req))) {
    return new Response(JSON.stringify({ message: 'No API session is active' }), { status: 403 });
  }

  if (!(await checkRateLimitAllowedEdge(req, RateLimiters.PUDGY))) {
    return new Response(JSON.stringify({ message: 'Rate limit exceeded' }), { status: 429 });
  }

  const { address } = await req.json();

  const cachedStatus = await PUDDY_CACHE?.get(`${CACHE_KEY_PREFIX}:${address}`);
  const claimed = Boolean(cachedStatus);

  return new Response(JSON.stringify({ claimed }), { status: 200 });
}
