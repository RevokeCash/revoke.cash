import { recomputeAllowances, recordAllowanceFailure } from '@revoke.cash/core/indexer/allowances';
import {
  failFastIfEventIndexingIsStillIndexing,
  getCachedAddressData,
} from '@revoke.cash/core/indexer/allowances-read';
import { indexEvents, recordEventsFailure } from '@revoke.cash/core/indexer/events';
import { addressSchema, supportedChainIdSchema } from '@revoke.cash/core/schemas';
import { authorizeRequest, RateLimiters, requirePremiumEntitlement } from 'lib/api/auth';
import { handleApiRouteError } from 'lib/api/errors';
import { parseRequest } from 'lib/api/validation';
import { dtoJsonResponse } from 'lib/dto';
import type { NextRequest } from 'next/server';
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
  try {
    const { params } = await parseAndAuthorizePremiumRequest(req, props);
    const result = await getCachedAddressData(params.address, params.chainId);
    return dtoJsonResponse(result);
  } catch (error) {
    return handleApiRouteError(error, { errorMessage: 'Error fetching cached address data' });
  }
}

// Refreshes indexed address data for premium users.
export async function POST(req: NextRequest, props: Props) {
  try {
    const { params } = await parseAndAuthorizePremiumRequest(req, props);
    await failFastIfEventIndexingIsStillIndexing(params.address, params.chainId);

    await indexEvents(params.address, params.chainId).catch(async (error) => {
      await recordEventsFailure(params.address, params.chainId, error);
      throw error;
    });

    await recomputeAllowances(params.address, params.chainId).catch(async (error) => {
      await recordAllowanceFailure(params.address, params.chainId, error);
      throw error;
    });

    const result = await getCachedAddressData(params.address, params.chainId);
    return dtoJsonResponse(result);
  } catch (error) {
    return handleApiRouteError(error, { errorMessage: 'Error refreshing cached address data' });
  }
}

const parseAndAuthorizePremiumRequest = async (req: NextRequest, props: Props) => {
  await authorizeRequest(req, {
    auth: 'api-session',
    rateLimiter: RateLimiters.PREMIUM_READ,
  });
  const { params } = await parseRequest(req, props, schemas);

  await requirePremiumEntitlement(params.address, 'Premium is required to access indexed allowance data');

  return { params };
};
