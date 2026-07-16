import { createRefundRequest } from '@revoke.cash/core/premium/refunds';
import { authorizeRequest, RateLimiters } from 'lib/api/auth';
import { handleApiRouteError } from 'lib/api/errors';
import { parseRequest } from 'lib/api/validation';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

interface Props {
  params: Promise<{ paymentId: string }>;
}

const schemas = {
  params: z.object({ paymentId: z.uuid() }),
  body: z.strictObject({
    reason: z.string().trim().max(500).optional(),
  }),
};

export const runtime = 'edge';

export async function POST(req: NextRequest, props: Props) {
  try {
    const { siweAddress } = await authorizeRequest(req, {
      auth: 'siwe',
      rateLimiter: RateLimiters.PREMIUM_WRITE,
    });
    const { params, body } = await parseRequest(req, props, schemas);

    const refundRequest = await createRefundRequest({
      ownerAddress: siweAddress,
      paymentId: params.paymentId,
      reason: body.reason,
    });

    return NextResponse.json(refundRequest);
  } catch (error) {
    return handleApiRouteError(error, { errorMessage: 'Failed to request a refund' });
  }
}
