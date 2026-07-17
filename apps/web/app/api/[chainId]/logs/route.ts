import { getScriptLogsProvider } from '@revoke.cash/core/events/providers';
import { addressSchema, hexStringSchema, supportedChainIdSchema } from '@revoke.cash/core/schemas';
import { ApiError, isTooMuchActivityError, parseErrorMessage } from '@revoke.cash/core/utils/errors';
import { authorizeRequest, RateLimiters } from 'lib/api/auth';
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
      address: addressSchema.optional(),
      topics: z.array(hexStringSchema.nullable()),
      fromBlock: z.number().int().nonnegative(),
      toBlock: z.number().int().nonnegative(),
    })
    .refine((filter) => filter.fromBlock <= filter.toBlock, { error: 'fromBlock must be <= toBlock' }),
};

export async function POST(req: NextRequest, props: Props) {
  try {
    await authorizeRequest(req, {
      auth: 'api-session',
      rateLimiter: RateLimiters.LOGS,
    });
    const { params, body: filter } = await parseRequest(req, props, schemas);
    const events = await getScriptLogsProvider(params.chainId).getLogs(filter);
    return NextResponse.json(events);
  } catch (error) {
    if (isTooMuchActivityError(error)) {
      console.error('Error fetching logs (too much activity)', parseErrorMessage(error));
      return handleApiRouteError(new ApiError(500, 'Address has too much activity'));
    }
    return handleApiRouteError(error, { errorMessage: 'Error fetching logs' });
  }
}
