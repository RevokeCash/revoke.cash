import { checkRateLimitAllowedEdge, getAuthenticatedSiweAddress, RateLimiters } from 'lib/api/auth';
import { parseRouteParams } from 'lib/api/validation';
import { getAutoRevokePermissionsBySubscription } from 'lib/auto-revoke/permissions';
import { subscriptionIdRouteParamsSchema } from 'lib/auto-revoke/schemas';
import { isActiveUltimateSubscriptionOwnedBy } from 'lib/premium/subscriptions';
import { type NextRequest, NextResponse } from 'next/server';

interface Props {
  params: Promise<{ id: string }>;
}

export const runtime = 'edge';

export async function GET(req: NextRequest, { params }: Props) {
  const siweAddress = await getAuthenticatedSiweAddress(req);
  if (!siweAddress) {
    return NextResponse.json({ message: 'No SIWE session is active' }, { status: 403 });
  }

  if (!(await checkRateLimitAllowedEdge(req, RateLimiters.PREMIUM_READ))) {
    return NextResponse.json({ message: 'Too many requests, please try again later.' }, { status: 429 });
  }

  const { data, error: validationError } = parseRouteParams(await params, subscriptionIdRouteParamsSchema);
  if (validationError) return validationError;

  if (!(await isActiveUltimateSubscriptionOwnedBy(data.id, siweAddress))) {
    return NextResponse.json({ message: 'Not authorized for this subscription' }, { status: 403 });
  }

  try {
    const permissions = await getAutoRevokePermissionsBySubscription(data.id);
    return NextResponse.json(permissions);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch permissions';
    return NextResponse.json({ message }, { status: 500 });
  }
}
