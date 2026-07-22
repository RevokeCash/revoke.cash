import { recordAuditEvent } from '@revoke.cash/core/audit/events';
import {
  getPermissionsByAddress,
  resolvePermissionRecord,
  savePermission,
} from '@revoke.cash/core/auto-revoke/permissions';
import { grantPermissionBodySchema } from 'app/api/auto-revoke/schemas';
import { authorizeRequest, RateLimiters } from 'lib/api/auth';
import { handleApiRouteError } from 'lib/api/errors';
import { parseRequest } from 'lib/api/validation';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const readSchemas = {
  params: z.undefined(),
  body: z.undefined(),
};

const grantSchemas = {
  params: z.undefined(),
  body: grantPermissionBodySchema,
};

export const runtime = 'edge';
export const preferredRegion = ['iad1'];

export async function GET(req: NextRequest) {
  try {
    const { siweAddress } = await authorizeRequest(req, {
      auth: 'siwe',
      rateLimiter: RateLimiters.PREMIUM_READ,
    });
    await parseRequest(req, undefined, readSchemas);
    const permissions = await getPermissionsByAddress(siweAddress);
    return NextResponse.json(permissions);
  } catch (error) {
    return handleApiRouteError(error, { errorMessage: 'Failed to fetch permissions' });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { siweAddress } = await authorizeRequest(req, {
      auth: 'siwe',
      rateLimiter: RateLimiters.PREMIUM_WRITE,
      requireUltimateEntitlement: true,
    });
    const { body } = await parseRequest(req, undefined, grantSchemas);

    const resolvedPermission = await resolvePermissionRecord(siweAddress, body);
    const result = await savePermission(resolvedPermission);

    await recordAuditEvent({
      action: 'auto_revoke_permission_granted',
      actorAddress: siweAddress,
      chainId: resolvedPermission.chainId,
      details: { permissionId: result.id, expiresAt: resolvedPermission.expiresAt },
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleApiRouteError(error, { errorMessage: 'Failed to grant permission' });
  }
}
