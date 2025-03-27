import { ERC721_ABI } from 'lib/abis';
import { RateLimiters, checkActiveSessionEdge, checkRateLimitAllowedEdge } from 'lib/api/auth';
import { createViemPublicClientForChain, getChainBackendPriceStrategy } from 'lib/utils/chains';
import type { Erc721TokenContract } from 'lib/utils/tokens';
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

// TODO: Support ERC20 token prices in this route as well

export async function GET(req: NextRequest, { params }: Props) {
  const { chainId: chainIdString, address } = await params;

  if (!(await checkActiveSessionEdge(req))) {
    return new Response(JSON.stringify({ message: 'No API session is active' }), { status: 403 });
  }

  if (!(await checkRateLimitAllowedEdge(req, RateLimiters.PRICE))) {
    return new Response(JSON.stringify({ message: 'Rate limit exceeded' }), { status: 429 });
  }

  const chainId = Number(chainIdString);

  const contract: Erc721TokenContract = {
    abi: ERC721_ABI,
    address,
    publicClient: createViemPublicClientForChain(chainId),
  };

  const backendPriceStrategy = getChainBackendPriceStrategy(chainId);

  if (!backendPriceStrategy) {
    return new Response(JSON.stringify({ message: `Chain with ID ${chainId} is unsupported` }), { status: 404 });
  }

  try {
    const floorPrice = await backendPriceStrategy.calculateTokenPrice(contract).catch(() => null);

    return new Response(JSON.stringify({ floorPrice }), {
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
