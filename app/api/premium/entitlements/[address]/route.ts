import { checkRateLimitAllowedEdge, RateLimiters } from 'lib/api/auth';
import { addressSchema } from 'lib/api/schemas';
import { parseRequest } from 'lib/api/validation';
import { hasActivePremiumEntitlement } from 'lib/premium/entitlements';
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
  if (!(await checkRateLimitAllowedEdge(req, RateLimiters.PREMIUM_READ))) {
    return NextResponse.json({ message: 'Rate limited' }, { status: 429 });
  }

  const { data, error } = await parseRequest(req, props, schemas);
  if (error) return error;
  const { address } = data.params;

  try {
    const isPremium = await hasActivePremiumEntitlement(address);

    return NextResponse.json(
      { isPremium },
      {
        headers: {
          'Cache-Control': `max-age=${60}`,
          'Vercel-CDN-Cache-Control': `s-maxage=${60}`,
        },
      },
    );
  } catch (error) {
    console.error('Error checking premium entitlement', error);

    return NextResponse.json({ isPremium: false });
  }
}
