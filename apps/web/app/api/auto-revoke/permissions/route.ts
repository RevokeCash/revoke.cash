import { recordAuditEvent } from '@revoke.cash/core/audit/events';
import {
  getPermissionsByAddress,
  recheckAccountUpgradedForAddress,
  resolvePermissionRecord,
  savePermission,
} from '@revoke.cash/core/auto-revoke/permissions';
import { grantPermissionBodySchema } from 'app/api/auto-revoke/schemas';
import { authorizeRequest, RateLimiters } from 'lib/api/auth';
import { handleApiRouteError } from 'lib/api/errors';
import { parseRequest } from 'lib/api/validation';
import { after, type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const readSchemas = {
  params: z.undefined(),
  body: z.undefined(),
};

const grantSchemas = {
  params: z.undefined(),
  body: grantPermissionBodySchema,
};

export async function GET(req: NextRequest) {
  try {
    const { siweAddress } = await authorizeRequest(req, {
      auth: 'siwe',
      rateLimiter: RateLimiters.PREMIUM_READ,
    });
    await parseRequest(req, undefined, readSchemas);

    const permissions = await getPermissionsByAddress(siweAddress);

    // A flagged wallet is re-checked before responding, so the warning clears on the first visit after the user upgraded
    if (permissions.some((permission) => permission.isActive && !permission.accountUpgraded)) {
      await recheckAccountUpgradedForAddress(siweAddress);
      return NextResponse.json(await getPermissionsByAddress(siweAddress));
    }

    // Off the critical path: re-check the wallet's smart account code after responding, so a
    // permission flagged account_not_upgraded recovers when the user upgraded and comes back.
    after(() =>
      recheckAccountUpgradedForAddress(siweAddress).catch((error) => {
        console.error('Failed to re-check delegator account code:', error);
      }),
    );

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
