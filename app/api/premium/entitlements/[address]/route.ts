import { hasActivePremiumEntitlement } from 'lib/premium/entitlements';
import { type NextRequest, NextResponse } from 'next/server';
import { getAddress } from 'viem';

interface Props {
  params: Promise<Params>;
}

interface Params {
  address: string;
}

export const runtime = 'edge';

export async function GET(_req: NextRequest, { params }: Props) {
  const { address } = await params;

  try {
    const normalizedAddress = getAddress(address);
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
