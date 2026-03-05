import { checkRateLimitAllowedEdge, getAuthenticatedSiweAddress, RateLimiters } from 'lib/api/auth';
import { createPayment } from 'lib/premium/payments';
import { type NextRequest, NextResponse } from 'next/server';

interface RequestBody {
  planId?: string;
  chainId?: number;
}

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const siweAddress = await getAuthenticatedSiweAddress(req);
  if (!siweAddress) {
    return NextResponse.json({ message: 'No SIWE session is active' }, { status: 403 });
  }

  if (!(await checkRateLimitAllowedEdge(req, RateLimiters.PREMIUM_WRITE))) {
    return NextResponse.json({ message: 'Too many requests, please try again later.' }, { status: 429 });
  }

  const body = (await req.json()) as RequestBody;

  if (!body.planId || typeof body.planId !== 'string') {
    return NextResponse.json({ message: 'Invalid planId' }, { status: 400 });
  }

  if (!body.chainId || typeof body.chainId !== 'number') {
    return NextResponse.json({ message: 'Invalid chainId' }, { status: 400 });
  }

  try {
    const payment = await createPayment({
      ownerAddress: siweAddress,
      planId: body.planId,
      chainId: body.chainId,
    });

    return NextResponse.json(payment);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create payment';
    const status = message.includes('Unsupported') ? 400 : 500;

    return NextResponse.json({ message }, { status });
  }
}
