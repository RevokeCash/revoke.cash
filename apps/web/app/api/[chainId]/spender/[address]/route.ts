import { WEBACY_API_KEY } from '@revoke.cash/core/constants';
import { addressSchema, supportedChainIdSchema } from '@revoke.cash/core/schemas';
import {
  AggregateSpenderDataSource,
  AggregationType,
} from '@revoke.cash/core/whois/spender/AggregateSpenderDataSource';
import { WhoisSpenderDataSource } from '@revoke.cash/core/whois/spender/label/WhoisSpenderDataSource';
import { OnchainSpenderRiskDataSource } from '@revoke.cash/core/whois/spender/risk/OnchainSpenderRiskDataSource';
import { ScamSnifferRiskDataSource } from '@revoke.cash/core/whois/spender/risk/ScamSnifferRiskDataSource';
import { WebacySpenderRiskDataSource } from '@revoke.cash/core/whois/spender/risk/WebacySpenderRiskDataSource';
import { authorizeRequest, RateLimiters } from 'lib/api/auth';
import { handleApiRouteError } from 'lib/api/errors';
import { parseRequest } from 'lib/api/validation';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

interface Props {
  params: Promise<{ chainId: string; address: string }>;
}

const schemas = {
  params: z.object({ chainId: supportedChainIdSchema, address: addressSchema }),
  body: z.undefined(),
};

export const runtime = 'edge';
export const preferredRegion = ['iad1'];

const SPENDER_DATA_SOURCE = new AggregateSpenderDataSource({
  aggregationType: AggregationType.PARALLEL_COMBINED,
  sources: [
    new WhoisSpenderDataSource(),
    new OnchainSpenderRiskDataSource(),
    new ScamSnifferRiskDataSource(),
    new WebacySpenderRiskDataSource(WEBACY_API_KEY),
  ],
});

export async function GET(req: NextRequest, props: Props) {
  try {
    await authorizeRequest(req, {
      auth: 'api-session',
      rateLimiter: RateLimiters.SPENDER,
    });
    const { params } = await parseRequest(req, props, schemas);
    const spenderData = await SPENDER_DATA_SOURCE.getSpenderData(params.address, params.chainId);

    return NextResponse.json(spenderData, {
      headers: {
        'Cache-Control': `max-age=${60 * 60}`, // 1 hour browser cache (mostly for localhost)
        'Vercel-CDN-Cache-Control': `s-maxage=${60 * 60 * 24}`, // 1 day (server CDN cache)
      },
    });
  } catch (error) {
    return handleApiRouteError(error, { errorMessage: 'Error fetching spender data' });
  }
}
