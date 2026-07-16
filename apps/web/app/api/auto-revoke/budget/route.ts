import { getAddressMonthlyBudget } from '@revoke.cash/core/auto-revoke/execution/budget';
import { authorizeRequest, RateLimiters } from 'lib/api/auth';
import { handleApiRouteError } from 'lib/api/errors';
import { parseRequest } from 'lib/api/validation';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const schemas = {
  params: z.undefined(),
  body: z.undefined(),
};

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { siweAddress } = await authorizeRequest(req, {
      auth: 'siwe',
      rateLimiter: RateLimiters.PREMIUM_READ,
    });
    await parseRequest(req, undefined, schemas);

    const budget = await getAddressMonthlyBudget(siweAddress);
    return NextResponse.json(budget);
  } catch (error) {
    return handleApiRouteError(error, { errorMessage: 'Failed to fetch budget' });
  }
}
