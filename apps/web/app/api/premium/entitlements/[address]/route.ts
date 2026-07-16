import { getActivePremiumEntitlementsWithSingleRetry } from '@revoke.cash/core/premium/entitlements';
import { isUltimatePlan } from '@revoke.cash/core/premium/plans';
import { addressSchema } from '@revoke.cash/core/schemas';
import { authorizeRequest, RateLimiters } from 'lib/api/auth';
import { handleApiRouteError } from 'lib/api/errors';
import { parseRequest } from 'lib/api/validation';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

interface Props {
  params: Promise<{ address: string }>;
}

const schemas = {
  params: z.object({ address: addressSchema }),
  body: z.undefined(),
};

export const runtime = 'edge';

export async function GET(req: NextRequest, props: Props) {
  try {
    await authorizeRequest(req, {
      rateLimiter: RateLimiters.PREMIUM_READ,
    });
    const { params } = await parseRequest(req, props, schemas);
    const { address } = params;

    try {
      const entitlements = await getActivePremiumEntitlementsWithSingleRetry(address);
      const isPremium = entitlements.length > 0;
      const isUltimate = entitlements.some((entitlement) => isUltimatePlan(entitlement));

      return NextResponse.json(
        { isPremium, isUltimate },
        {
          headers: {
            'Cache-Control': `max-age=${60}`,
            'Vercel-CDN-Cache-Control': `s-maxage=${60}`,
          },
        },
      );
    } catch (error) {
      console.error('Error checking premium entitlement', error);
      return NextResponse.json({ isPremium: false, isUltimate: false });
    }
  } catch (error) {
    return handleApiRouteError(error);
  }
}
