import { checkRateLimitAllowedEdge, getAuthenticatedSiweAddress, RateLimiters } from 'lib/api/auth';
import { upgradeSubscriptionPlan } from 'lib/premium/subscriptions';
import { type NextRequest, NextResponse } from 'next/server';

interface Props {
  params: Promise<Params>;
}

interface Params {
  id: string;
}

interface RequestBody {
  planId?: string;
}

export const runtime = 'edge';

export async function PUT(req: NextRequest, { params }: Props) {
  const siweAddress = await getAuthenticatedSiweAddress(req);
  if (!siweAddress) {
    return NextResponse.json({ message: 'No SIWE session is active' }, { status: 403 });
  }

  if (!(await checkRateLimitAllowedEdge(req, RateLimiters.PREMIUM_WRITE))) {
    return NextResponse.json({ message: 'Too many requests, please try again later.' }, { status: 429 });
  }

  const { id: subscriptionId } = await params;
  const body = (await req.json()) as RequestBody;

  if (!body.planId || typeof body.planId !== 'string') {
    return NextResponse.json({ message: 'Invalid plan ID' }, { status: 400 });
  }

  try {
    await upgradeSubscriptionPlan({
      ownerAddress: siweAddress,
      subscriptionId,
      planId: body.planId,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to upgrade subscription';
    const status =
      message.includes('Subscription not found') ||
      message.includes('Subscription has expired') ||
      message.includes('Plan not found') ||
      message.includes('Cannot downgrade')
        ? 400
        : 500;

    return NextResponse.json({ message }, { status });
  }
}
