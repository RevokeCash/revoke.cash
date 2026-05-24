import { getChainNativeTokenCoingeckoId } from '@revoke.cash/core/chains';
import { COINGECKO_API_BASE_URL, COINGECKO_API_KEY } from '@revoke.cash/core/constants';
import { RequestQueue } from '@revoke.cash/core/request-queue';
import { supportedChainIdSchema } from '@revoke.cash/core/schemas';
import { isNullish } from '@revoke.cash/core/utils';
import { MINUTE } from '@revoke.cash/core/utils/time';
import { Redis } from '@upstash/redis';
import ky from 'ky';
import { authorizeRequest, RateLimiters } from 'lib/api/auth';
import { handleApiRouteError } from 'lib/api/errors';
import { parseRequest } from 'lib/api/validation';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

interface Props {
  params: Promise<{ chainId: string }>;
}

const schemas = {
  params: z.object({ chainId: supportedChainIdSchema }),
  body: z.undefined(),
};

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

export async function GET(req: NextRequest, props: Props) {
  try {
    await authorizeRequest(req, {
      auth: 'api-session',
      rateLimiter: RateLimiters.PRICE,
    });
    const { params } = await parseRequest(req, props, schemas);
    const price = await getNativeTokenPrice(params.chainId);

    return NextResponse.json(
      { price },
      {
        headers: {
          'Cache-Control': `max-age=${CACHE_TTL}`,
          'Vercel-CDN-Cache-Control': `s-maxage=${CACHE_TTL}`,
        },
      },
    );
  } catch (error) {
    return handleApiRouteError(error, { errorMessage: 'Error fetching native token price' });
  }
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
