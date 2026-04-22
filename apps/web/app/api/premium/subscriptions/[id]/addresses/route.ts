import { checkRateLimitAllowedEdge, getAuthenticatedSiweAddress, RateLimiters } from 'lib/api/auth';
import { addressSchema, uuidSchema } from 'lib/api/schemas';
import { parseRequest } from 'lib/api/validation';
import { addSubscriptionAddress } from 'lib/premium/subscriptions';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

interface Props {
  params: Promise<{ id: string }>;
}

const schemas = {
  params: z.object({ id: uuidSchema }),
  body: z.object({ address: addressSchema }).strict(),
};

export const runtime = 'edge';

export async function POST(req: NextRequest, props: Props) {
  const siweAddress = await getAuthenticatedSiweAddress(req);
  if (!siweAddress) {
    return NextResponse.json({ message: 'No SIWE session is active' }, { status: 403 });
  }

  if (!(await checkRateLimitAllowedEdge(req, RateLimiters.PREMIUM_WRITE))) {
    return NextResponse.json({ message: 'Too many requests, please try again later.' }, { status: 429 });
  }

  const { data, error } = await parseRequest(req, props, schemas);
  if (error) return error;
  const { id: subscriptionId } = data.params;
  const { address } = data.body;

  try {
    await addSubscriptionAddress({
      ownerAddress: siweAddress,
      subscriptionId,
      address,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to add subscription address';
    const status =
      message.includes('Subscription not found') ||
      message.includes('Subscription has expired') ||
      message.includes('No available wallet slots') ||
      message.includes('Address already added') ||
      message.includes('Invalid address')
        ? 400
        : 500;

    return NextResponse.json({ message }, { status });
  }
}
