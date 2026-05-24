import type { DocumentedChainId } from '@revoke.cash/core/chains';
import { recomputeAllowances, recordAllowanceFailure } from '@revoke.cash/core/monitor/allowances';
import { getCachedAddressData } from '@revoke.cash/core/monitor/allowances-read';
import { recordScanFailure, scanAddressChain } from '@revoke.cash/core/monitor/scan';
import { enrichToken, findUnenrichedTokens } from '@revoke.cash/core/monitor/token-enrichment';
import { hasActivePremiumEntitlement } from '@revoke.cash/core/premium/entitlements';
import { addressSchema, supportedChainIdSchema } from '@revoke.cash/core/schemas';
import { ExportableError, parseErrorMessage } from '@revoke.cash/core/utils/errors';
import { mapAsyncBounded } from '@revoke.cash/core/utils/promises';
import { checkActiveSessionEdge, checkRateLimitAllowedEdge, RateLimiters } from 'lib/api/auth';
import { parseRequest } from 'lib/api/validation';
import { dtoJsonResponse } from 'lib/dto';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

interface Props {
  params: Promise<{ chainId: string; address: string }>;
}

const schemas = {
  params: z.object({ chainId: supportedChainIdSchema, address: addressSchema }),
  body: z.undefined(),
};

// Gets indexed address data for premium users.
export async function GET(req: NextRequest, props: Props) {
  const parsed = await parseAndAuthorizeRequest(req, props, RateLimiters.PREMIUM_READ);
  if (parsed instanceof NextResponse) return parsed;
  const { params } = parsed;

  try {
    const result = await getCachedAddressData(params.address, params.chainId);
    return dtoJsonResponse(result);
  } catch (e) {
    return handleAllowanceRouteError(e, 'Error fetching cached address data');
  }
}

// Refreshes indexed address data for premium users.
export async function POST(req: NextRequest, props: Props) {
  const parsed = await parseAndAuthorizeRequest(req, props, RateLimiters.PREMIUM_READ);
  if (parsed instanceof NextResponse) return parsed;
  const { params } = parsed;

  try {
    const scanResult = await scanAddressChain(params.address, params.chainId).catch(async (error) => {
      await recordScanFailure(params.address, params.chainId, error);
      throw error;
    });

    if (!scanResult.nonceZeroSkipped) {
      await enrichObservedTokens(params.chainId, scanResult.fromBlock, scanResult.toBlock);
    }

    await recomputeAllowances(params.address, params.chainId).catch(async (error) => {
      await recordAllowanceFailure(params.address, params.chainId, error);
      throw error;
    });

    const result = await getCachedAddressData(params.address, params.chainId, {
      failFast: false,
      resolveMissingTimestamps: true,
    });
    return dtoJsonResponse(result);
  } catch (e) {
    return handleAllowanceRouteError(e, 'Error refreshing cached address data');
  }
}

const parseAndAuthorizeRequest = async (
  req: NextRequest,
  props: Props,
  rateLimiter: typeof RateLimiters.PREMIUM_READ,
): Promise<{ params: z.infer<typeof schemas.params> } | NextResponse> => {
  if (!(await checkActiveSessionEdge(req))) {
    return NextResponse.json({ message: 'No API session is active' }, { status: 403 });
  }

  if (!(await checkRateLimitAllowedEdge(req, rateLimiter))) {
    return NextResponse.json({ message: 'Too many requests, please try again later.' }, { status: 429 });
  }

  const { data, error } = await parseRequest(req, props, schemas);
  if (error) return error;
  const { params } = data;

  const isPremium = await hasActivePremiumEntitlement(params.address);
  if (!isPremium) {
    return NextResponse.json({ message: 'Premium is required to access indexed allowance data' }, { status: 403 });
  }

  return { params };
};

const enrichObservedTokens = async (chainId: DocumentedChainId, fromBlock: number, toBlock: number) => {
  const tokens = await findUnenrichedTokens({ chainId, fromBlock, toBlock });

  await mapAsyncBounded(tokens, 10, async (token) => {
    try {
      await enrichToken(chainId, token);
    } catch (error) {
      console.warn(`Failed to enrich token ${token} on chain ${chainId}`, parseErrorMessage(error), error);
    }
  });
};

const handleAllowanceRouteError = (error: unknown, fallbackMessage: string) => {
  if (error instanceof ExportableError) {
    const { status, body } = error.export();
    return NextResponse.json(body, { status });
  }

  console.error(fallbackMessage, parseErrorMessage(error), error);
  return NextResponse.json({ message: parseErrorMessage(error) }, { status: 500 });
};
