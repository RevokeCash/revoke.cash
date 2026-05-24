import { revokeAutoRevokePermission } from '@revoke.cash/core/auto-revoke/permissions';
import { autoRevokeSupportedChainIdSchema } from '@revoke.cash/core/schemas';
import { authorizeRequest, RateLimiters } from 'lib/api/auth';
import { handleApiRouteError } from 'lib/api/errors';
import { parseRequest } from 'lib/api/validation';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

interface Props {
  params: Promise<{ chainId: string }>;
}

const schemas = {
  params: z.object({ chainId: autoRevokeSupportedChainIdSchema }),
  body: z.undefined(),
};

export const runtime = 'edge';

export async function DELETE(req: NextRequest, props: Props) {
  try {
    const { siweAddress } = await authorizeRequest(req, {
      auth: 'siwe',
      rateLimiter: RateLimiters.PREMIUM_WRITE,
      requireUltimateEntitlement: true,
    });
    const { params } = await parseRequest(req, props, schemas);

    await revokeAutoRevokePermission(siweAddress, params.chainId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiRouteError(error, { errorMessage: 'Failed to revoke permission' });
  }
}
