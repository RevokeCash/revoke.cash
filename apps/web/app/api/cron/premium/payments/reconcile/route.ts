import { reconcilePendingPayments } from 'lib/premium/verify-payment';
import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await reconcilePendingPayments(100);
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Cron reconcile-payments failed', error);
    return NextResponse.json({ message: 'Failed to reconcile payments' }, { status: 500 });
  }
}
