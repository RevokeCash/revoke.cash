import { getScriptLogsProvider } from '@revoke.cash/core/events/providers';
import { supportedChainIdSchema } from '@revoke.cash/core/schemas';
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
  body: z.undefined(),
};

export async function GET(req: NextRequest, props: Props) {
  try {
    await authorizeRequest(req, {
      auth: 'api-session',
      rateLimiter: RateLimiters.LOGS,
    });
    const { params } = await parseRequest(req, props, schemas);
    const scriptLogsProvider = getScriptLogsProvider(params.chainId);
    const blockNumber = await scriptLogsProvider.getLatestBlock();
    return NextResponse.json({ blockNumber });
  } catch (error) {
    return handleApiRouteError(error, { errorMessage: 'Error fetching latest block' });
  }
}
