import { recordAuditEvent } from '@revoke.cash/core/audit/events';
import { getSubscriptionRules, upsertSubscriptionRules } from '@revoke.cash/core/auto-revoke/evaluation/rules';
import { isActiveUltimateSubscriptionOwnedBy } from '@revoke.cash/core/premium/subscriptions';
import { ApiError } from '@revoke.cash/core/utils/errors';
import { rulesDataBodySchema } from 'app/api/auto-revoke/schemas';
import { authorizeRequest, RateLimiters } from 'lib/api/auth';
import { handleApiRouteError } from 'lib/api/errors';
import { parseRequest } from 'lib/api/validation';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

interface Props {
  params: Promise<{ id: string }>;
}

const schemas = {
  GET: {
    params: z.object({ id: z.uuid() }),
    body: z.undefined(),
  },
  PUT: {
    params: z.object({ id: z.uuid() }),
    body: rulesDataBodySchema,
  },
};

export const runtime = 'edge';

export async function GET(req: NextRequest, props: Props) {
  try {
    const { siweAddress } = await authorizeRequest(req, {
      auth: 'siwe',
      rateLimiter: RateLimiters.PREMIUM_READ,
    });
    const { params } = await parseRequest(req, props, schemas.GET);
    const { id: subscriptionId } = params;

    if (!(await isActiveUltimateSubscriptionOwnedBy(subscriptionId, siweAddress))) {
      throw new ApiError(403, 'Not authorized for this subscription');
    }

    const rules = await getSubscriptionRules(subscriptionId);
    return NextResponse.json(rules);
  } catch (error) {
    return handleApiRouteError(error, { errorMessage: 'Failed to fetch rules' });
  }
}

export async function PUT(req: NextRequest, props: Props) {
  try {
    const { siweAddress } = await authorizeRequest(req, {
      auth: 'siwe',
      rateLimiter: RateLimiters.PREMIUM_WRITE,
    });
    const { params, body } = await parseRequest(req, props, schemas.PUT);
    const { id: subscriptionId } = params;

    if (!(await isActiveUltimateSubscriptionOwnedBy(subscriptionId, siweAddress))) {
      throw new ApiError(403, 'Not authorized for this subscription');
    }

    await upsertSubscriptionRules(subscriptionId, body);

    await recordAuditEvent({
      action: 'auto_revoke_subscription_rules_updated',
      actorAddress: siweAddress,
      subscriptionId,
      details: body,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiRouteError(error, { errorMessage: 'Failed to update rules' });
  }
}
