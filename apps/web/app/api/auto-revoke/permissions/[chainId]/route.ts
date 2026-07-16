import { recordAuditEvent } from '@revoke.cash/core/audit/events';
import { revokePermission } from '@revoke.cash/core/auto-revoke/permissions';
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

    const { revokedCount } = await revokePermission(siweAddress, params.chainId);

    if (revokedCount > 0) {
      await recordAuditEvent({
        action: 'auto_revoke_permission_revoked',
        actorAddress: siweAddress,
        chainId: params.chainId,
        details: {},
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiRouteError(error, { errorMessage: 'Failed to revoke permission' });
  }
}
