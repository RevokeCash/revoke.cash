import { recordAuditEvent } from '@revoke.cash/core/audit/events';
import { upsertAddressRules } from '@revoke.cash/core/auto-revoke/evaluation/rules';
import { rulesDataBodySchema } from 'app/api/auto-revoke/schemas';
import { authorizeRequest, RateLimiters } from 'lib/api/auth';
import { handleApiRouteError } from 'lib/api/errors';
import { parseRequest } from 'lib/api/validation';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const updateSchemas = {
  params: z.undefined(),
  body: rulesDataBodySchema,
};

export const runtime = 'edge';

export async function PUT(req: NextRequest) {
  try {
    const { siweAddress } = await authorizeRequest(req, {
      auth: 'siwe',
      rateLimiter: RateLimiters.PREMIUM_WRITE,
      requireUltimateEntitlement: true,
    });
    const { body } = await parseRequest(req, undefined, updateSchemas);

    await upsertAddressRules(siweAddress, body);

    await recordAuditEvent({ action: 'auto_revoke_rules_updated', actorAddress: siweAddress, details: body });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiRouteError(error, { errorMessage: 'Failed to update rules' });
  }
}
