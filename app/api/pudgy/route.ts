import { Redis } from '@upstash/redis';
import { canMint } from 'app/[locale]/pudgy/utils';
import { RateLimiters, checkActiveSessionEdge, checkRateLimitAllowedEdge } from 'lib/api/auth';
import { getTokenEvents } from 'lib/chains/events';
import { getAllowancesFromEvents } from 'lib/utils/allowances';
import { createViemPublicClientForChain } from 'lib/utils/chains';
import type { NextRequest } from 'next/server';

export const runtime = 'edge';

const PUDDY_CACHE = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : undefined;

const CACHE_TTL = 30 * 24 * 60 * 60; // 30 days

export async function POST(req: NextRequest) {
  if (!(await checkActiveSessionEdge(req))) {
    return new Response(JSON.stringify({ message: 'No API session is active' }), { status: 403 });
  }

  if (!(await checkRateLimitAllowedEdge(req, RateLimiters.PUDGY))) {
    return new Response(JSON.stringify({ message: 'Rate limit exceeded' }), { status: 429 });
  }

  // We only check Ethereum for now
  const chainId = 1;
  const { address } = await req.json();

  const cachedStatus = await PUDDY_CACHE?.get(`pudgy-checker-staging:${address}`);
  if (cachedStatus) {
    return new Response(JSON.stringify({ status: cachedStatus }), { status: 200 });
  }

  // Get the events and allowances for the user
  const publicClient = createViemPublicClientForChain(chainId);
  const events = await getTokenEvents(chainId, address);
  const allowances = await getAllowancesFromEvents(address, events, publicClient, chainId);

  // Check if the user owns any of the tokens that enable them to mint
  if (!canMint(allowances)) {
    return new Response(
      JSON.stringify({ status: 'no_tokens', message: 'User does not own any Pudgy-related tokens' }),
      { status: 400 },
    );
  }

  const activeAllowances = allowances.filter((allowance) => Boolean(allowance.payload));
  if (activeAllowances.length > 0) {
    return new Response(JSON.stringify({ status: 'has_allowances', message: 'User has active allowances' }), {
      status: 400,
    });
  }

  // TODO: Call the Pudgy API to mint

  // We set the user status to has_claimed so that they can't claim again
  await PUDDY_CACHE?.set(`pudgy-checker-staging:${address}`, 'already_claimed', { ex: CACHE_TTL });

  return new Response(JSON.stringify({ status: 'eligible' }), { status: 200 });
}
