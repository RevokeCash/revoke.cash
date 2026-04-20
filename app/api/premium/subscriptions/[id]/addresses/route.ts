import { checkRateLimitAllowedEdge, getAuthenticatedSiweAddress, RateLimiters } from 'lib/api/auth';
import { addSubscriptionAddress } from 'lib/premium/subscriptions';
import { type NextRequest, NextResponse } from 'next/server';
import { getAddress } from 'viem';

interface Props {
  params: Promise<Params>;
}

interface Params {
  id: string;
}

interface RequestBody {
  address?: string;
}

export const runtime = 'edge';

export async function POST(req: NextRequest, { params }: Props) {
  const siweAddress = await getAuthenticatedSiweAddress(req);
  if (!siweAddress) {
    return NextResponse.json({ message: 'No SIWE session is active' }, { status: 403 });
  }

  if (!(await checkRateLimitAllowedEdge(req, RateLimiters.PREMIUM_WRITE))) {
    return NextResponse.json({ message: 'Too many requests, please try again later.' }, { status: 429 });
  }

  const { id: subscriptionId } = await params;
  const body = (await req.json()) as RequestBody;

  if (!body.address || typeof body.address !== 'string') {
    return NextResponse.json({ message: 'Invalid address' }, { status: 400 });
  }

  try {
    const normalizedAddress = getAddress(body.address);

    await addSubscriptionAddress({
      ownerAddress: siweAddress,
      subscriptionId,
      address: normalizedAddress,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to add subscription address';
    const status =
      message.includes('Subscription not found') ||
      message.includes('Subscription has expired') ||
      message.includes('No available wallet slots') ||
      message.includes('Address already added') ||
      message.includes('Invalid address')
        ? 400
        : 500;

    return NextResponse.json({ message }, { status });
  }
}
