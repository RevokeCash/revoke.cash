import { checkRateLimitAllowedEdge, getAuthenticatedSiweAddress, RateLimiters } from 'lib/api/auth';
import { parseJsonBody, parseRouteParams } from 'lib/api/validation';
import { getSubscriptionRules, upsertSubscriptionRules } from 'lib/auto-revoke/rules';
import { rulesDataSchema, subscriptionIdRouteParamsSchema } from 'lib/auto-revoke/schemas';
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

  const { data: routeParams, error: paramsError } = parseRouteParams(await params, subscriptionIdRouteParamsSchema);
  if (paramsError) return paramsError;

  if (!(await isActiveUltimateSubscriptionOwnedBy(routeParams.id, siweAddress))) {
    return NextResponse.json({ message: 'Not authorized for this subscription' }, { status: 403 });
  }

  try {
    const rules = await getSubscriptionRules(routeParams.id);
    return NextResponse.json(rules);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch rules';
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Props) {
  const siweAddress = await getAuthenticatedSiweAddress(req);
  if (!siweAddress) {
    return NextResponse.json({ message: 'No SIWE session is active' }, { status: 403 });
  }

  if (!(await checkRateLimitAllowedEdge(req, RateLimiters.PREMIUM_WRITE))) {
    return NextResponse.json({ message: 'Too many requests, please try again later.' }, { status: 429 });
  }

  const { data: routeParams, error: paramsError } = parseRouteParams(await params, subscriptionIdRouteParamsSchema);
  if (paramsError) return paramsError;

  if (!(await isActiveUltimateSubscriptionOwnedBy(routeParams.id, siweAddress))) {
    return NextResponse.json({ message: 'Not authorized for this subscription' }, { status: 403 });
  }

  const { data, error: validationError } = await parseJsonBody(req, rulesDataSchema);
  if (validationError) return validationError;

  try {
    await upsertSubscriptionRules(routeParams.id, data);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update rules';
    return NextResponse.json({ message }, { status: 500 });
  }
}
