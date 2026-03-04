import { checkRateLimitAllowedEdge, getAuthenticatedSiweAddress, RateLimiters } from 'lib/api/auth';
import { removeSubscriptionAddress } from 'lib/premium/subscriptions';
import { type NextRequest, NextResponse } from 'next/server';
import { getAddress } from 'viem';

interface Props {
  params: Promise<Params>;
}

interface Params {
  id: string;
  address: string;
}

export const runtime = 'edge';

export async function DELETE(req: NextRequest, { params }: Props) {
  const siweAddress = await getAuthenticatedSiweAddress(req);
  if (!siweAddress) {
    return NextResponse.json({ message: 'No SIWE session is active' }, { status: 403 });
  }

  if (!(await checkRateLimitAllowedEdge(req, RateLimiters.PREMIUM_WRITE))) {
    return NextResponse.json({ message: 'Too many requests, please try again later.' }, { status: 429 });
  }

  const { id: subscriptionId, address } = await params;

  try {
    const normalizedAddress = getAddress(address);

    await removeSubscriptionAddress({
      ownerAddress: siweAddress,
      subscriptionId,
      address: normalizedAddress,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to remove subscription address';
    const status =
      message.includes('Subscription not found') ||
      message.includes('Subscription has expired') ||
      message.includes('Cannot remove subscription owner address') ||
      message.includes('Invalid address')
        ? 400
        : 500;

    return NextResponse.json({ message }, { status });
  }
}
