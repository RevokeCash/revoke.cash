import {
  enrichSpender,
  getCachedSpenderMetadata,
  serializeSpenderMetadata,
} from '@revoke.cash/core/indexer/spender-metadata';
import { addressSchema, supportedChainIdSchema } from '@revoke.cash/core/schemas';
import { authorizeRequest, RateLimiters } from 'lib/api/auth';
import { handleApiRouteError } from 'lib/api/errors';
import { parseRequest } from 'lib/api/validation';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

interface Props {
  params: Promise<{ chainId: string; address: string }>;
}

const schemas = {
  params: z.object({ chainId: supportedChainIdSchema, address: addressSchema }),
  body: z.undefined(),
};

export const preferredRegion = ['iad1'];

export async function GET(req: NextRequest, props: Props) {
  try {
    await authorizeRequest(req, {
      auth: 'api-session',
      rateLimiter: RateLimiters.SPENDER,
    });
    const { params } = await parseRequest(req, props, schemas);
    const spenderData = await getSpenderData(params.chainId, params.address);

    return NextResponse.json(spenderData, {
      headers: {
        'Cache-Control': `max-age=${60 * 60}`, // 1 hour browser cache (mostly for localhost)
        'Vercel-CDN-Cache-Control': `s-maxage=${60 * 60 * 24}`, // 1 day (server CDN cache)
      },
    });
  } catch (error) {
    return handleApiRouteError(error, { errorMessage: 'Error fetching spender data' });
  }
}

const getSpenderData = async (chainId: number, address: `0x${string}`) => {
  const cachedMetadata = await getCachedSpenderMetadata(chainId, [address]);
  const metadata = cachedMetadata.get(address);

  if (metadata) return serializeSpenderMetadata(metadata) ?? null;

  await enrichSpender(chainId, address);
  const refreshedMetadata = await getCachedSpenderMetadata(chainId, [address]);
  return serializeSpenderMetadata(refreshedMetadata.get(address)) ?? null;
};
