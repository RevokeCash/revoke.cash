import { getPremiumPlans } from 'lib/premium/plans';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const plans = await getPremiumPlans();

    return NextResponse.json(
      { plans },
      {
        headers: {
          'Cache-Control': `max-age=${60 * 5}`,
          'Vercel-CDN-Cache-Control': `s-maxage=${60 * 60}`,
        },
      },
    );
  } catch (error) {
    console.error('Error loading premium plans', error);
    return NextResponse.json({ message: 'Failed to load plans' }, { status: 500 });
  }
}
