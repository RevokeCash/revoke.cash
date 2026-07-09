import { reconcilePaymentByOwner } from '@revoke.cash/core/premium/verify-payment';
import { authorizeRequest, RateLimiters } from 'lib/api/auth';
import { handleApiRouteError } from 'lib/api/errors';
import { parseRequest } from 'lib/api/validation';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

interface Props {
  params: Promise<{ paymentId: string }>;
}

const schemas = {
  params: z.object({ paymentId: z.uuid() }),
  body: z.undefined(),
};

export const runtime = 'nodejs';

export async function GET(req: NextRequest, props: Props) {
  try {
    const { siweAddress } = await authorizeRequest(req, {
      auth: 'siwe',
      rateLimiter: RateLimiters.PREMIUM_READ,
    });
    const { params } = await parseRequest(req, props, schemas);
    const { paymentId } = params;

    const status = await reconcilePaymentByOwner(paymentId, siweAddress);
    if (!status) {
      return NextResponse.json({ message: 'Payment not found' }, { status: 404 });
    }

    return NextResponse.json(status);
  } catch (error) {
    return handleApiRouteError(error);
  }
}
