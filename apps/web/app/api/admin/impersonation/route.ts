import { recordAuditEvent } from '@revoke.cash/core/audit/events';
import { addressSchema } from '@revoke.cash/core/schemas';
import { authorizeRequest, RateLimiters, storeImpersonation } from 'lib/api/auth';
import { handleApiRouteError } from 'lib/api/errors';
import { parseRequest } from 'lib/api/validation';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const schemas = {
  POST: {
    params: z.undefined(),
    body: z.strictObject({
      address: addressSchema,
    }),
  },
  DELETE: {
    params: z.undefined(),
    body: z.undefined(),
  },
};

// Starts viewing the site as another user: SIWE read routes resolve to that user's address until the admin
// stops impersonating, signs in again, or the session expires. SIWE write routes are rejected throughout.
export async function POST(req: NextRequest) {
  try {
    const { siweAddress: adminAddress } = await authorizeRequest(req, {
      auth: 'siwe',
      requireAdmin: true,
      rateLimiter: RateLimiters.PREMIUM_WRITE,
    });
    const { body } = await parseRequest(req, undefined, schemas.POST);

    const res = NextResponse.json({ ok: true });
    await storeImpersonation(req, res, body.address);

    await recordAuditEvent({
      action: 'admin_impersonation_started',
      actorAddress: adminAddress,
      targetAddress: body.address,
      details: {},
    });

    return res;
  } catch (error) {
    return handleApiRouteError(error, { errorMessage: 'Failed to start impersonation' });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await authorizeRequest(req, { auth: 'siwe', requireAdmin: true, rateLimiter: RateLimiters.PREMIUM_WRITE });
    await parseRequest(req, undefined, schemas.DELETE);

    const res = NextResponse.json({ ok: true });
    await storeImpersonation(req, res, null);
    return res;
  } catch (error) {
    return handleApiRouteError(error, { errorMessage: 'Failed to stop impersonation' });
  }
}
