import { getAutoRevokePermissionsBySubscription } from '@revoke.cash/core/auto-revoke/permissions';
import { isActiveUltimateSubscriptionOwnedBy } from '@revoke.cash/core/premium/subscriptions';
import { uuidSchema } from '@revoke.cash/core/schemas';
import { authorizeRequest, RateLimiters } from 'lib/api/auth';
import { ApiError, handleApiRouteError } from 'lib/api/errors';
import { parseRequest } from 'lib/api/validation';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

interface Props {
  params: Promise<{ id: string }>;
}

const schemas = {
  params: z.object({ id: uuidSchema }),
  body: z.undefined(),
};

export const runtime = 'edge';

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

    const permissions = await getAutoRevokePermissionsBySubscription(subscriptionId);
    return NextResponse.json(permissions);
  } catch (error) {
    return handleApiRouteError(error, { errorMessage: 'Failed to fetch permissions' });
  }
}
