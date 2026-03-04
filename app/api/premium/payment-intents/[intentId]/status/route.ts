import { checkRateLimitAllowedEdge, getAuthenticatedSiweAddress, RateLimiters } from 'lib/api/auth';
import { reconcilePaymentIntentByOwner } from 'lib/premium/verify-payment';
import { type NextRequest, NextResponse } from 'next/server';

interface Props {
  params: Promise<Params>;
}

interface Params {
  intentId: string;
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

  const { intentId } = await params;

  if (!intentId) {
    return NextResponse.json({ message: 'Missing intentId' }, { status: 400 });
  }

  const status = await reconcilePaymentIntentByOwner(intentId, siweAddress);
  if (!status) {
    return NextResponse.json({ message: 'Payment intent not found' }, { status: 404 });
  }

  return NextResponse.json(status);
}
