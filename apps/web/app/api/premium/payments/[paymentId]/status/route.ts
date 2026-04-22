import { reconcilePaymentByOwner } from '@revoke.cash/core/premium/verify-payment';
import { uuidSchema } from '@revoke.cash/core/schemas';
import { checkRateLimitAllowedEdge, getAuthenticatedSiweAddress, RateLimiters } from 'lib/api/auth';
import { parseRequest } from 'lib/api/validation';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

interface Props {
  params: Promise<{ paymentId: string }>;
}

const schemas = {
  params: z.object({ paymentId: uuidSchema }),
  body: z.undefined(),
};

export const runtime = 'nodejs';

export async function GET(req: NextRequest, props: Props) {
  const siweAddress = await getAuthenticatedSiweAddress(req);
  if (!siweAddress) {
    return NextResponse.json({ message: 'No SIWE session is active' }, { status: 403 });
  }

  if (!(await checkRateLimitAllowedEdge(req, RateLimiters.PREMIUM_READ))) {
    return NextResponse.json({ message: 'Too many requests, please try again later.' }, { status: 429 });
  }

  const { data, error } = await parseRequest(req, props, schemas);
  if (error) return error;
  const { paymentId } = data.params;

  const status = await reconcilePaymentByOwner(paymentId, siweAddress);
  if (!status) {
    return NextResponse.json({ message: 'Payment not found' }, { status: 404 });
  }

  return NextResponse.json(status);
}
