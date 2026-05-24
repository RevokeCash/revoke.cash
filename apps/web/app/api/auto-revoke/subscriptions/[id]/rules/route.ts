import { getSubscriptionRules, upsertSubscriptionRules } from '@revoke.cash/core/auto-revoke/rules';
import { isActiveUltimateSubscriptionOwnedBy } from '@revoke.cash/core/premium/subscriptions';
import { uuidSchema } from '@revoke.cash/core/schemas';
import { rulesDataBodySchema } from 'app/api/auto-revoke/schemas';
import { authorizeRequest, RateLimiters } from 'lib/api/auth';
import { ApiError, handleApiRouteError } from 'lib/api/errors';
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
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiRouteError(error, { errorMessage: 'Failed to update rules' });
  }
}
