import { type DocumentedChainId, getChainName } from '@revoke.cash/core/chains';
import { recomputeAllowances, recordAllowanceFailure } from '@revoke.cash/core/indexer/allowances';
import { getCachedAddressData } from '@revoke.cash/core/indexer/allowances-read';
import {
  failFastIfAddressHasTooMuchActivity,
  failFastIfAddressIsTokenContract,
  failFastIfAllowanceStateIsTooFarBehind,
  failFastIfEventsStateIsBehind,
  getIndexerReadStates,
} from '@revoke.cash/core/indexer/cache-state';
import { indexEvents, recordEventsFailure } from '@revoke.cash/core/indexer/events';
import { addressSchema, supportedChainIdSchema } from '@revoke.cash/core/schemas';
import { ApiError, ExportableError, parseErrorMessage } from '@revoke.cash/core/utils/errors';
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

export const maxDuration = 30;

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
    const { eventsState, allowanceState } = await getIndexerReadStates(params.address, params.chainId);
    failFastIfAddressHasTooMuchActivity(eventsState, params.chainId);
    failFastIfAddressHasTooMuchActivity(allowanceState, params.chainId);
    failFastIfAddressIsTokenContract(eventsState, params.chainId);
    failFastIfEventsStateIsBehind(eventsState);
    failFastIfAllowanceStateIsTooFarBehind(eventsState, allowanceState);

    await indexEvents(params.address, params.chainId).catch(async (error) => {
      await recordEventsFailure(params.address, params.chainId, error);
      throw toRefreshError(error, params.chainId);
    });

    await recomputeAllowances(params.address, params.chainId).catch(async (error) => {
      await recordAllowanceFailure(params.address, params.chainId, error);
      throw toRefreshError(error, params.chainId);
    });

    const result = await getCachedAddressData(params.address, params.chainId);
    return dtoJsonResponse(result);
  } catch (error) {
    return handleApiRouteError(error, { errorMessage: 'Error refreshing cached address data' });
  }
}

// The real scan error is included so the dashboard can classify it and show it in the error tooltip
const toRefreshError = (error: unknown, chainId: DocumentedChainId): Error => {
  if (error instanceof ExportableError) return error;
  return new ApiError(503, `Could not refresh ${getChainName(chainId)} data: ${parseErrorMessage(error)}`);
};

const parseAndAuthorizePremiumRequest = async (req: NextRequest, props: Props) => {
  await authorizeRequest(req, {
    auth: 'api-session',
    rateLimiter: RateLimiters.PREMIUM_READ,
  });
  const { params } = await parseRequest(req, props, schemas);

  await requirePremiumEntitlement(params.address, 'Premium is required to access indexed allowance data');

  return { params };
};
