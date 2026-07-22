import { getSubscriptionActivity } from '@revoke.cash/core/auto-revoke/activity';
import { isActiveUltimateSubscriptionOwnedBy } from '@revoke.cash/core/premium/subscriptions';
import { ApiError } from '@revoke.cash/core/utils/errors';
import { authorizeRequest, RateLimiters } from 'lib/api/auth';
import { handleApiRouteError } from 'lib/api/errors';
import { parseRequest } from 'lib/api/validation';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

interface Props {
  params: Promise<{ id: string }>;
}

const schemas = {
  params: z.object({ id: z.uuid() }),
  body: z.undefined(),
};

export const runtime = 'edge';
export const preferredRegion = ['iad1'];

export async function GET(req: NextRequest, props: Props) {
  try {
    const { siweAddress } = await authorizeRequest(req, {
      auth: 'siwe',
      rateLimiter: RateLimiters.PREMIUM_READ,
    });
    const { params } = await parseRequest(req, props, schemas);
    const { id: subscriptionId } = params;

    if (!(await isActiveUltimateSubscriptionOwnedBy(subscriptionId, siweAddress))) {
      throw new ApiError(403, 'Not authorized for this subscription');
    }

    const activity = await getSubscriptionActivity(subscriptionId);
    return NextResponse.json(activity);
  } catch (error) {
    return handleApiRouteError(error, { errorMessage: 'Failed to fetch activity' });
  }
}
