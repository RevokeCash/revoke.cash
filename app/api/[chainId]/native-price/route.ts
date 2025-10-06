import { Redis } from '@upstash/redis';
import ky from 'ky';
import { checkActiveSessionEdge, checkRateLimitAllowedEdge, RateLimiters } from 'lib/api/auth';
import { RequestQueue } from 'lib/api/logs/RequestQueue';
import { COINGECKO_API_BASE_URL, COINGECKO_API_KEY } from 'lib/constants';
import { isNullish } from 'lib/utils';
import { getChainNativeTokenCoingeckoId } from 'lib/utils/chains';
import { MINUTE } from 'lib/utils/time';
import type { NextRequest } from 'next/server';

interface Props {
  params: Promise<Params>;
}

interface Params {
  chainId: string;
}

export const runtime = 'edge';
export const preferredRegion = ['iad1'];

const PRICE_CACHE = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : undefined;

// Coingecko has a limit of 500 requests per minute, that we undercut
const PRICE_QUEUE = new RequestQueue('token-price-native', {
  intervalCap: 400,
  interval: 1 * MINUTE,
});

const CACHE_TTL = 1 * 60 * 20; // 20 minutes

export async function GET(req: NextRequest, { params }: Props) {
  const { chainId: chainIdString } = await params;

  if (!(await checkActiveSessionEdge(req))) {
    return new Response(JSON.stringify({ message: 'No API session is active' }), { status: 403 });
  }

  if (!(await checkRateLimitAllowedEdge(req, RateLimiters.PRICE))) {
    return new Response(JSON.stringify({ message: 'Rate limit exceeded' }), { status: 429 });
  }

  const chainId = Number(chainIdString);
  const price = await getNativeTokenPrice(chainId);

  return new Response(JSON.stringify({ price }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': `max-age=${CACHE_TTL}`,
      'Vercel-CDN-Cache-Control': `s-maxage=${CACHE_TTL}`,
    },
  });
}

const getNativeTokenPrice = async (chainId: number) => {
  const nativeTokenCoingeckoId = getChainNativeTokenCoingeckoId(chainId);
  if (!nativeTokenCoingeckoId) return null;

  const cachedPrice = await PRICE_CACHE?.get(`token-price-native:${chainId}`);
  if (cachedPrice === -1) return null;
  if (!isNullish(cachedPrice)) return cachedPrice;

  const url = `${COINGECKO_API_BASE_URL}/simple/price?vs_currencies=usd&precision=full&ids=${nativeTokenCoingeckoId}`;
  const headers = { 'x-cg-pro-api-key': COINGECKO_API_KEY };

  const result = await PRICE_QUEUE.add(() => ky.get(url, { headers }).json<{ [key: string]: { usd: number } }>());

  const price = result?.[nativeTokenCoingeckoId]?.usd ?? -1;
  await PRICE_CACHE?.set(`token-price-native:${chainId}`, price, { ex: CACHE_TTL });

  if (price === -1) return null;
  return price;
};
