import { getBatchRevokeSponsor } from '@revoke.cash/core/batch-revokes/sponsors';
import { isTestnetChain } from '@revoke.cash/core/chains';
import { BATCH_REVOKE_FEE_USD_CENTS } from '@revoke.cash/core/constants';
import { getDb } from '@revoke.cash/core/db/client';
import { batchRevokes } from '@revoke.cash/core/db/schema/batch-revokes';
import { hasActivePremiumEntitlement } from '@revoke.cash/core/premium/entitlements';
import { addressSchema, supportedChainIdSchema, transactionHashSchema } from '@revoke.cash/core/schemas';
import { sql } from 'drizzle-orm';
import { authorizeRequest, getClientCountry, RateLimiters } from 'lib/api/auth';
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
    .strictObject({
      transactionHash: transactionHashSchema.nullable(),
      userAddress: addressSchema,
      feeUsdCents: z.number().int().min(0).max(BATCH_REVOKE_FEE_USD_CENTS),
    })
    .refine((body) => body.feeUsdCents > 0 === (body.transactionHash !== null), {
      message: 'A paid fee requires its transaction hash and a waived fee has none',
      path: ['transactionHash'],
    }),
};

export async function POST(req: NextRequest, props: Props) {
  try {
    await authorizeRequest(req, {
      auth: 'api-session',
      rateLimiter: RateLimiters.BATCH_REVOKE,
    });
    const { params, body } = await parseRequest(req, props, schemas);

    // A paid fee has no sponsor; a waived fee is attributed to the address's premium subscription or the chain sponsor
    const isPremium = body.feeUsdCents === 0 && (await hasActivePremiumEntitlement(body.userAddress));
    const sponsor = body.feeUsdCents > 0 ? null : getBatchRevokeSponsor(params.chainId, isPremium);

    await getDb()
      .insert(batchRevokes)
      .values({
        chainId: params.chainId,
        feeTransactionHash: body.transactionHash,
        userAddress: body.userAddress,
        feeUsdCents: body.feeUsdCents,
        isTestnet: isTestnetChain(params.chainId),
        vatRegion: getClientCountry(req),
        sponsor,
        timestamp: new Date(),
      })
      // One fee transaction is one batch revoke, so a repeated report of the same transaction is ignored
      .onConflictDoNothing({
        target: [batchRevokes.chainId, batchRevokes.feeTransactionHash],
        where: sql`${batchRevokes.feeTransactionHash} IS NOT NULL`,
      });

    return NextResponse.json({});
  } catch (error) {
    return handleApiRouteError(error, { errorMessage: 'Failed to record batch revoke' });
  }
}
