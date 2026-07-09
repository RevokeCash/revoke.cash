import { getAddressRulesConfig, switchRulesSource } from '@revoke.cash/core/auto-revoke/evaluation/rules';
import { authorizeRequest, RateLimiters } from 'lib/api/auth';
import { handleApiRouteError } from 'lib/api/errors';
import { parseRequest } from 'lib/api/validation';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const readSchemas = {
  params: z.undefined(),
  body: z.undefined(),
};

const updateSchemas = {
  params: z.undefined(),
  body: z.strictObject({ subscriptionId: z.uuid().nullable() }),
};

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { siweAddress } = await authorizeRequest(req, {
      auth: 'siwe',
      rateLimiter: RateLimiters.PREMIUM_READ,
    });
    await parseRequest(req, undefined, readSchemas);
    const rulesConfig = await getAddressRulesConfig(siweAddress);
    return NextResponse.json(rulesConfig);
  } catch (error) {
    return handleApiRouteError(error, { errorMessage: 'Failed to fetch rules config' });
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
    const { subscriptionId } = body;

    await switchRulesSource(siweAddress, { subscriptionId });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiRouteError(error, { errorMessage: 'Failed to update rules config' });
  }
}
