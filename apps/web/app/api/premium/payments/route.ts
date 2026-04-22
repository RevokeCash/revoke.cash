import {
  checkRateLimitAllowedEdge,
  getAuthenticatedSiweAddress,
  getClientCountryEdge,
  RateLimiters,
} from 'lib/api/auth';
import { chainIdSchema } from 'lib/api/schemas';
import { parseRequest } from 'lib/api/validation';
import { isSupportedPaymentChainId } from 'lib/premium/payment-config';
import { createPayment } from 'lib/premium/payments';
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
  const siweAddress = await getAuthenticatedSiweAddress(req);
  if (!siweAddress) {
    return NextResponse.json({ message: 'No SIWE session is active' }, { status: 403 });
  }

  if (!(await checkRateLimitAllowedEdge(req, RateLimiters.PREMIUM_WRITE))) {
    return NextResponse.json({ message: 'Too many requests, please try again later.' }, { status: 429 });
  }

  const { data, error } = await parseRequest(req, undefined, schemas);
  if (error) return error;
  const { planId, chainId } = data.body;

  try {
    const payment = await createPayment({
      ownerAddress: siweAddress,
      planId,
      chainId,
      vatRegion: getClientCountryEdge(req),
    });

    return NextResponse.json(payment);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create payment';
    const status = message.includes('Unsupported') ? 400 : 500;

    return NextResponse.json({ message }, { status });
  }
}
