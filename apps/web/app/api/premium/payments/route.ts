import { isSupportedPaymentChainId } from '@revoke.cash/core/premium/payment-config';
import { createPayment } from '@revoke.cash/core/premium/payments';
import { chainIdSchema } from '@revoke.cash/core/schemas';
import { authorizeRequest, getClientCountryEdge, RateLimiters } from 'lib/api/auth';
import { handleApiRouteError } from 'lib/api/errors';
import { parseRequest } from 'lib/api/validation';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const schemas = {
  params: z.undefined(),
  body: z
    .object({
      planId: z.string().min(1),
      chainId: chainIdSchema.refine(isSupportedPaymentChainId, {
        message: 'Unsupported payment chain',
        params: { status: 404 },
      }),
    })
    .strict(),
};

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { siweAddress } = await authorizeRequest(req, {
      auth: 'siwe',
      rateLimiter: RateLimiters.PREMIUM_WRITE,
    });
    const { body } = await parseRequest(req, undefined, schemas);
    const { planId, chainId } = body;

    const payment = await createPayment({
      ownerAddress: siweAddress,
      planId,
      chainId,
      vatRegion: getClientCountryEdge(req),
    });

    return NextResponse.json(payment);
  } catch (error) {
    return handleApiRouteError(error);
  }
}
