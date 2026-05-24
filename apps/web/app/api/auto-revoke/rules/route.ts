import { getAddressRules, upsertAddressRules } from '@revoke.cash/core/auto-revoke/rules';
import { rulesDataBodySchema } from 'app/api/auto-revoke/schemas';
import { authorizeRequest, RateLimiters } from 'lib/api/auth';
import { ApiError, handleApiRouteError } from 'lib/api/errors';
import { parseRequest } from 'lib/api/validation';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const readSchemas = {
  params: z.undefined(),
  body: z.undefined(),
};

const updateSchemas = {
  params: z.undefined(),
  body: rulesDataBodySchema,
};

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { siweAddress } = await authorizeRequest(req, {
      auth: 'siwe',
      rateLimiter: RateLimiters.PREMIUM_READ,
    });
    await parseRequest(req, undefined, readSchemas);

    const rules = await getAddressRules(siweAddress);
    if (!rules) {
      throw new ApiError(404, 'No custom rules configured');
    }

    return NextResponse.json({
      riskDetectionEnabled: rules.riskDetectionEnabled,
      riskSensitivity: rules.riskSensitivity,
      staleApprovalEnabled: rules.staleApprovalEnabled,
      staleApprovalThresholdDays: rules.staleApprovalThresholdDays ?? 30,
    });
  } catch (error) {
    return handleApiRouteError(error, { errorMessage: 'Failed to fetch rules' });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { siweAddress } = await authorizeRequest(req, {
      auth: 'siwe',
      rateLimiter: RateLimiters.PREMIUM_WRITE,
      requireUltimateEntitlement: true,
    });
    const { body } = await parseRequest(req, undefined, updateSchemas);

    await upsertAddressRules(siweAddress, body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiRouteError(error, { errorMessage: 'Failed to update rules' });
  }
}
