import { checkRateLimitAllowedEdge, getAuthenticatedSiweAddress, RateLimiters } from 'lib/api/auth';
import { reconcilePaymentByOwner } from 'lib/premium/verify-payment';
import { type NextRequest, NextResponse } from 'next/server';

interface Props {
  params: Promise<Params>;
}

interface Params {
  paymentId: string;
}

export const runtime = 'nodejs';

export async function GET(req: NextRequest, { params }: Props) {
  const siweAddress = await getAuthenticatedSiweAddress(req);
  if (!siweAddress) {
    return NextResponse.json({ message: 'No SIWE session is active' }, { status: 403 });
  }

  if (!(await checkRateLimitAllowedEdge(req, RateLimiters.PREMIUM_READ))) {
    return NextResponse.json({ message: 'Too many requests, please try again later.' }, { status: 429 });
  }

  const { paymentId } = await params;

  if (!paymentId) {
    return NextResponse.json({ message: 'Missing paymentId' }, { status: 400 });
  }

  const status = await reconcilePaymentByOwner(paymentId, siweAddress);
  if (!status) {
    return NextResponse.json({ message: 'Payment not found' }, { status: 404 });
  }

  return NextResponse.json(status);
}
