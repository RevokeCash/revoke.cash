import { RateLimiters, checkActiveSessionEdge, checkRateLimitAllowedEdge } from 'lib/api/auth';
import { WEBACY_API_KEY } from 'lib/constants';
import { AggregateSpenderDataSource, AggregationType } from 'lib/whois/spender/AggregateSpenderDataSource';
import { WhoisSpenderDataSource } from 'lib/whois/spender/label/WhoisSpenderDataSource';
import { OnchainSpenderRiskDataSource } from 'lib/whois/spender/risk/OnchainSpenderRiskDataSource';
import { ScamSnifferRiskDataSource } from 'lib/whois/spender/risk/ScamSnifferRiskDataSource';
import { WebacySpenderRiskDataSource } from 'lib/whois/spender/risk/WebacySpenderRiskDataSource';
import type { NextRequest } from 'next/server';
import type { Address } from 'viem';

interface Props {
  params: Promise<Params>;
}

interface Params {
  chainId: string;
  address: Address;
}

export const runtime = 'edge';
export const preferredRegion = ['iad1'];

const SPENDER_DATA_SOURCE = new AggregateSpenderDataSource({
  aggregationType: AggregationType.PARALLEL_COMBINED,
  sources: [
    new AggregateSpenderDataSource({
      aggregationType: AggregationType.SEQUENTIAL_FIRST,
      sources: [
        new WhoisSpenderDataSource(),
        // new HarpieSpenderDataSource(), // TODO: Re-enable if possible
      ],
    }),
    new OnchainSpenderRiskDataSource(),
    new ScamSnifferRiskDataSource(),
    new WebacySpenderRiskDataSource(WEBACY_API_KEY),
  ],
});

export async function GET(req: NextRequest, { params }: Props) {
  const { chainId: chainIdString, address } = await params;

  if (!(await checkActiveSessionEdge(req))) {
    return new Response(JSON.stringify({ message: 'No API session is active' }), { status: 403 });
  }

  if (!(await checkRateLimitAllowedEdge(req, RateLimiters.SPENDER))) {
    return new Response(JSON.stringify({ message: 'Rate limit exceeded' }), { status: 429 });
  }

  const chainId = Number.parseInt(chainIdString, 10);

  try {
    const spenderData = await SPENDER_DATA_SOURCE.getSpenderData(address, chainId);

    return new Response(JSON.stringify(spenderData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `max-age=${60 * 60}`, // 1 hour browser cache (mostly for localhost)
        'Vercel-CDN-Cache-Control': `s-maxage=${60 * 60 * 24}`, // 1 day (server CDN cache)
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ message: (e as any).message }), { status: 500 });
  }
}
