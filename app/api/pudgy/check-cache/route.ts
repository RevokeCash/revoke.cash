import { Redis } from '@upstash/redis';
import { RateLimiters, checkActiveSessionEdge, checkRateLimitAllowedEdge } from 'lib/api/auth';
import type { NextRequest } from 'next/server';

export const runtime = 'edge';

export const PUDDY_CACHE = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : undefined;

export const CACHE_TTL = 30 * 24 * 60 * 60; // 30 days
export const CACHE_KEY_PREFIX = 'pudgy-checker-staging';

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
