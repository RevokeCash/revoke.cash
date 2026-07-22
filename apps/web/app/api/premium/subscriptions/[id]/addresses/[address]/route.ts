import { recordAuditEvent } from '@revoke.cash/core/audit/events';
import { removeSubscriptionAddress } from '@revoke.cash/core/premium/subscriptions';
import { addressSchema } from '@revoke.cash/core/schemas';
import { authorizeRequest, RateLimiters } from 'lib/api/auth';
import { handleApiRouteError } from 'lib/api/errors';
import { parseRequest } from 'lib/api/validation';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

interface Props {
  params: Promise<{ id: string; address: string }>;
}

const schemas = {
  params: z.object({ id: z.uuid(), address: addressSchema }),
  body: z.undefined(),
};

export const runtime = 'edge';
export const preferredRegion = ['iad1'];

export async function DELETE(req: NextRequest, props: Props) {
  try {
    const { siweAddress } = await authorizeRequest(req, {
      auth: 'siwe',
      rateLimiter: RateLimiters.PREMIUM_WRITE,
    });
    const { params } = await parseRequest(req, props, schemas);
    const { id: subscriptionId, address } = params;

    const { removed } = await removeSubscriptionAddress({
      ownerAddress: siweAddress,
      subscriptionId,
      address,
    });

    if (removed) {
      await recordAuditEvent({
        action: 'subscription_address_removed',
        actorAddress: siweAddress,
        targetAddress: address,
        subscriptionId,
        details: {},
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiRouteError(error);
  }
}
