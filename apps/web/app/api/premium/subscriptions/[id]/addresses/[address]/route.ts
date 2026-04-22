import { removeSubscriptionAddress } from '@revoke.cash/core/premium/subscriptions';
import { addressSchema, uuidSchema } from '@revoke.cash/core/schemas';
import { checkRateLimitAllowedEdge, getAuthenticatedSiweAddress, RateLimiters } from 'lib/api/auth';
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
  const siweAddress = await getAuthenticatedSiweAddress(req);
  if (!siweAddress) {
    return NextResponse.json({ message: 'No SIWE session is active' }, { status: 403 });
  }

  if (!(await checkRateLimitAllowedEdge(req, RateLimiters.PREMIUM_WRITE))) {
    return NextResponse.json({ message: 'Too many requests, please try again later.' }, { status: 429 });
  }

  const { data, error } = await parseRequest(req, props, schemas);
  if (error) return error;
  const { id: subscriptionId, address } = data.params;

  try {
    await removeSubscriptionAddress({
      ownerAddress: siweAddress,
      subscriptionId,
      address,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to remove subscription address';
    const status =
      message.includes('Subscription not found') ||
      message.includes('Subscription has expired') ||
      message.includes('Cannot remove subscription owner address') ||
      message.includes('Invalid address')
        ? 400
        : 500;

    return NextResponse.json({ message }, { status });
  }
}
