import { isTestnetChain } from '@revoke.cash/core/chains';
import { getDb } from '@revoke.cash/core/db/client';
import { batchRevokes } from '@revoke.cash/core/db/schema/batch-revokes';
import { addressSchema, supportedChainIdSchema, transactionHashSchema } from '@revoke.cash/core/schemas';
import { authorizeRequest, getClientCountryEdge, RateLimiters } from 'lib/api/auth';
import { handleApiRouteError } from 'lib/api/errors';
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
  try {
    await authorizeRequest(req, {
      auth: 'api-session',
      rateLimiter: RateLimiters.BATCH_REVOKE,
    });
    const { params, body } = await parseRequest(req, props, schemas);
    const db = getDb();

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
    return handleApiRouteError(error, { errorMessage: 'Failed to record batch revoke', exposeErrorMessage: false });
  }
}
