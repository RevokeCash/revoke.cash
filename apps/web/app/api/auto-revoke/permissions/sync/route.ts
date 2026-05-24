import { resolvePermissionRecord, syncAutoRevokePermissions } from '@revoke.cash/core/auto-revoke/permissions';
import { authorizeRequest, RateLimiters } from 'lib/api/auth';
import { handleApiRouteError } from 'lib/api/errors';
import { parseRequest } from 'lib/api/validation';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { syncPermissionsBodySchema } from '../../schemas';

const schemas = {
  params: z.undefined(),
  body: syncPermissionsBodySchema,
};

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { siweAddress } = await authorizeRequest(req, {
      auth: 'siwe',
      rateLimiter: RateLimiters.PREMIUM_WRITE,
      requireUltimateEntitlement: true,
    });
    const { body } = await parseRequest(req, undefined, schemas);

    const resolvedPermissions = await Promise.all(
      body.permissions.map((item) => resolvePermissionRecord(siweAddress, item)),
    );
    const results = await syncAutoRevokePermissions(siweAddress, resolvedPermissions);
    return NextResponse.json({ results });
  } catch (error) {
    return handleApiRouteError(error, { errorMessage: 'Failed to sync permissions' });
  }
}
