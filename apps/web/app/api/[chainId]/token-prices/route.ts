import { getTokenPricesUsd } from '@revoke.cash/core/prices';
import { addressSchema, supportedChainIdSchema } from '@revoke.cash/core/schemas';
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
  body: z.strictObject({ addresses: z.array(addressSchema) }),
};

export const runtime = 'edge';
export const preferredRegion = ['iad1'];

export async function POST(req: NextRequest, props: Props) {
  try {
    await authorizeRequest(req, {
      auth: 'api-session',
      rateLimiter: RateLimiters.PRICE,
    });
    const { params, body } = await parseRequest(req, props, schemas);
    const prices = await getTokenPricesUsd(params.chainId, body.addresses);

    return NextResponse.json({ prices });
  } catch (error) {
    return handleApiRouteError(error, { errorMessage: 'Error fetching token prices' });
  }
}
