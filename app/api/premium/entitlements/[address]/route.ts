import { checkRateLimitAllowedEdge, RateLimiters } from 'lib/api/auth';
import { hasActivePremiumEntitlement } from 'lib/premium/entitlements';
import { type NextRequest, NextResponse } from 'next/server';
import { type Address, getAddress } from 'viem';

interface Props {
  params: Promise<Params>;
}

interface Params {
  address: string;
}

export const runtime = 'edge';

export async function GET(req: NextRequest, { params }: Props) {
  if (!(await checkRateLimitAllowedEdge(req, RateLimiters.PREMIUM_READ))) {
    return NextResponse.json({ message: 'Rate limited' }, { status: 429 });
  }

  const { address } = await params;

  let normalizedAddress: Address;
  try {
    normalizedAddress = getAddress(address);
  } catch {
    return NextResponse.json({ message: 'Invalid address' }, { status: 400 });
  }

  try {
    const isPremium = await hasActivePremiumEntitlement(normalizedAddress);

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
