import { getSubscriptionRules, upsertSubscriptionRules } from '@revoke.cash/core/auto-revoke/rules';
import { isActiveUltimateSubscriptionOwnedBy } from '@revoke.cash/core/premium/subscriptions';
import { uuidSchema } from '@revoke.cash/core/schemas';
import { rulesDataBodySchema } from 'app/api/auto-revoke/schemas';
import { checkRateLimitAllowedEdge, getAuthenticatedSiweAddress, RateLimiters } from 'lib/api/auth';
import { parseRequest } from 'lib/api/validation';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

interface Props {
  params: Promise<{ id: string }>;
}

const schemas = {
  GET: {
    params: z.object({ id: uuidSchema }),
    body: z.undefined(),
  },
  PUT: {
    params: z.object({ id: uuidSchema }),
    body: rulesDataBodySchema,
  },
};

export const runtime = 'edge';

export async function GET(req: NextRequest, props: Props) {
  const siweAddress = await getAuthenticatedSiweAddress(req);
  if (!siweAddress) {
    return NextResponse.json({ message: 'No SIWE session is active' }, { status: 403 });
  }

  if (!(await checkRateLimitAllowedEdge(req, RateLimiters.PREMIUM_READ))) {
    return NextResponse.json({ message: 'Too many requests, please try again later.' }, { status: 429 });
  }

  const { data, error } = await parseRequest(req, props, schemas.GET);
  if (error) return error;
  const { id: subscriptionId } = data.params;

  if (!(await isActiveUltimateSubscriptionOwnedBy(subscriptionId, siweAddress))) {
    return NextResponse.json({ message: 'Not authorized for this subscription' }, { status: 403 });
  }

  try {
    const rules = await getSubscriptionRules(subscriptionId);
    return NextResponse.json(rules);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch rules';
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, props: Props) {
  const siweAddress = await getAuthenticatedSiweAddress(req);
  if (!siweAddress) {
    return NextResponse.json({ message: 'No SIWE session is active' }, { status: 403 });
  }

  if (!(await checkRateLimitAllowedEdge(req, RateLimiters.PREMIUM_WRITE))) {
    return NextResponse.json({ message: 'Too many requests, please try again later.' }, { status: 429 });
  }

  const { data, error } = await parseRequest(req, props, schemas.PUT);
  if (error) return error;
  const { id: subscriptionId } = data.params;

  if (!(await isActiveUltimateSubscriptionOwnedBy(subscriptionId, siweAddress))) {
    return NextResponse.json({ message: 'Not authorized for this subscription' }, { status: 403 });
  }

  try {
    await upsertSubscriptionRules(subscriptionId, data.body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update rules';
    return NextResponse.json({ message }, { status: 500 });
  }
}
