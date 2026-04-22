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
import { checkActiveSessionEdge, checkRateLimitAllowedEdge, RateLimiters } from 'lib/api/auth';
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
  if (!(await checkActiveSessionEdge(req))) {
    return NextResponse.json({ message: 'No API session is active' }, { status: 403 });
  }

  if (!(await checkRateLimitAllowedEdge(req, RateLimiters.SPENDER))) {
    return NextResponse.json({ message: 'Rate limit exceeded' }, { status: 429 });
  }

  const { data, error } = await parseRequest(req, props, schemas);
  if (error) return error;
  const { params } = data;

  try {
    const spenderData = await SPENDER_DATA_SOURCE.getSpenderData(params.address, params.chainId);

    return NextResponse.json(spenderData, {
      headers: {
        'Cache-Control': `max-age=${60 * 60}`, // 1 hour browser cache (mostly for localhost)
        'Vercel-CDN-Cache-Control': `s-maxage=${60 * 60 * 24}`, // 1 day (server CDN cache)
      },
    });
  } catch (e) {
    return NextResponse.json({ message: (e as any).message }, { status: 500 });
  }
}
