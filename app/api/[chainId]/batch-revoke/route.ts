import { checkActiveSessionEdge, checkRateLimitAllowedEdge, getClientCountryEdge, RateLimiters } from 'lib/api/auth';
import { getDb } from 'lib/db/client';
import { batchRevokes } from 'lib/db/schema/batch-revokes';
import { isTestnetChain } from 'lib/utils/chains';
import { type NextRequest, NextResponse } from 'next/server';

interface Props {
  params: Promise<Params>;
}

interface Params {
  chainId: string;
}

export const runtime = 'edge';

export async function POST(req: NextRequest, { params }: Props) {
  const { chainId: chainIdString } = await params;

  if (!(await checkActiveSessionEdge(req))) {
    return NextResponse.json({ message: 'No API session is active' }, { status: 403 });
  }

  if (!(await checkRateLimitAllowedEdge(req, RateLimiters.BATCH_REVOKE))) {
    return NextResponse.json({ message: 'Too many requests, please try again later.' }, { status: 429 });
  }

  const db = getDb();

  const chainId = Number(chainIdString);
  const body = await req.json();

  try {
    await db.insert(batchRevokes).values({
      chainId,
      feeTransactionHash: body.transactionHash,
      userAddress: body.userAddress,
      feePaid: Math.round((Number(body.feePaid) ?? 0) * 100),
      isTestnet: isTestnetChain(chainId),
      vatRegion: getClientCountryEdge(req),
      sponsor: body.sponsor,
      timestamp: new Date(),
    });

    return NextResponse.json({});
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Failed to record batch revoke' }, { status: 500 });
  }
}
