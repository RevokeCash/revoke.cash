import { RateLimiters, checkActiveSessionEdge, checkRateLimitAllowedEdge } from 'lib/api/auth';
import { covalentEventGetter, etherscanEventGetter, nodeEventGetter } from 'lib/api/globals';
import { isCovalentSupportedChain, isEtherscanSupportedChain, isNodeSupportedChain } from 'lib/utils/chains';
import { parseErrorMessage } from 'lib/utils/errors';
import type { NextRequest } from 'next/server';

interface Props {
  params: Promise<Params>;
}

interface Params {
  chainId: string;
}

export async function POST(req: NextRequest, { params }: Props) {
  const { chainId: chainIdString } = await params;

  if (!(await checkActiveSessionEdge(req))) {
    return new Response(JSON.stringify({ message: 'No API session is active' }), { status: 403 });
  }

  if (!(await checkRateLimitAllowedEdge(req, RateLimiters.LOGS))) {
    return new Response(JSON.stringify({ message: 'Too many requests, please try again later.' }), { status: 429 });
  }

  const chainId = Number.parseInt(chainIdString, 10);
  const body = await req.json();

  try {
    if (isCovalentSupportedChain(chainId)) {
      const events = await covalentEventGetter.getEvents(chainId, body);
      return new Response(JSON.stringify(events), { status: 200 });
    }

    if (isEtherscanSupportedChain(chainId)) {
      const events = await etherscanEventGetter.getEvents(chainId, body);
      return new Response(JSON.stringify(events), { status: 200 });
    }

    if (isNodeSupportedChain(chainId)) {
      const events = await nodeEventGetter.getEvents(chainId, body);
      return new Response(JSON.stringify(events), { status: 200 });
    }
  } catch (e) {
    console.error('Error occurred', parseErrorMessage(e));
    return new Response(JSON.stringify({ message: parseErrorMessage(e) }), { status: 500 });
  }

  return new Response(JSON.stringify({ message: `Chain with ID ${chainId} is unsupported` }), { status: 404 });
}
