import { removeSubscriptionAddress } from '@revoke.cash/core/premium/subscriptions';
import { addressSchema, uuidSchema } from '@revoke.cash/core/schemas';
import { authorizeRequest, RateLimiters } from 'lib/api/auth';
import { handleApiRouteError } from 'lib/api/errors';
import { parseRequest } from 'lib/api/validation';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

interface Props {
  params: Promise<{ id: string; address: string }>;
}

const schemas = {
  params: z.object({ id: uuidSchema, address: addressSchema }),
  body: z.undefined(),
};

export const runtime = 'edge';

export async function DELETE(req: NextRequest, props: Props) {
  try {
    const { siweAddress } = await authorizeRequest(req, {
      auth: 'siwe',
      rateLimiter: RateLimiters.PREMIUM_WRITE,
    });
    const { params } = await parseRequest(req, props, schemas);
    const { id: subscriptionId, address } = params;

    await removeSubscriptionAddress({
      ownerAddress: siweAddress,
      subscriptionId,
      address,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiRouteError(error);
  }
}
