import { isTestnetChain } from '@revoke.cash/core/chains';
import { getDb } from '@revoke.cash/core/db/client';
import { batchRevokes } from '@revoke.cash/core/db/schema/batch-revokes';
import { addressSchema, supportedChainIdSchema, transactionHashSchema } from '@revoke.cash/core/schemas';
import { checkActiveSessionEdge, checkRateLimitAllowedEdge, getClientCountryEdge, RateLimiters } from 'lib/api/auth';
import { parseRequest } from 'lib/api/validation';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

interface Props {
  params: Promise<{ chainId: string }>;
}

const schemas = {
  params: z.object({ chainId: supportedChainIdSchema }),
  body: z
    .object({
      transactionHash: transactionHashSchema.nullable(),
      userAddress: addressSchema,
      feePaid: z.number().nonnegative(),
      sponsor: z.string().nullable(),
    })
    .strict(),
};

export const runtime = 'edge';

export async function POST(req: NextRequest, props: Props) {
  if (!(await checkActiveSessionEdge(req))) {
    return NextResponse.json({ message: 'No API session is active' }, { status: 403 });
  }

  if (!(await checkRateLimitAllowedEdge(req, RateLimiters.BATCH_REVOKE))) {
    return NextResponse.json({ message: 'Too many requests, please try again later.' }, { status: 429 });
  }

  const { data, error } = await parseRequest(req, props, schemas);
  if (error) return error;
  const { params, body } = data;

  const db = getDb();

  try {
    await db.insert(batchRevokes).values({
      chainId: params.chainId,
      feeTransactionHash: body.transactionHash,
      userAddress: body.userAddress,
      feePaid: Math.round(body.feePaid * 100),
      isTestnet: isTestnetChain(params.chainId),
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
