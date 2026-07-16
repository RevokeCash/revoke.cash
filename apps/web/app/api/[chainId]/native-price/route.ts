import { getNativeTokenPriceUsd } from '@revoke.cash/core/prices';
import { supportedChainIdSchema } from '@revoke.cash/core/schemas';
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

const CACHE_TTL = 1 * 60 * 20; // 20 minutes

export async function GET(req: NextRequest, props: Props) {
  try {
    await authorizeRequest(req, {
      auth: 'api-session',
      rateLimiter: RateLimiters.PRICE,
    });
    const { params } = await parseRequest(req, props, schemas);
    const price = await getNativeTokenPriceUsd(params.chainId);

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
