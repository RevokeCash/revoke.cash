import { ERC721_ABI } from 'lib/abis';
import { RateLimiters, checkActiveSessionEdge, checkRateLimitAllowedEdge } from 'lib/api/auth';
import type { Erc721TokenContract } from 'lib/interfaces';
import { createViemPublicClientForChain, getChainBackendPriceStrategy } from 'lib/utils/chains';
import type { NextRequest } from 'next/server';
import type { Address } from 'viem';

export const config = {
  runtime: 'edge',
};

// TODO: Support ERC20 token prices in this route as well
const handler = async (req: NextRequest) => {
  if (req.method !== 'GET')
    return new Response(JSON.stringify({ message: 'Method not allowed' }), {
      status: 405,
    });

  if (!(await checkActiveSessionEdge(req))) {
    return new Response(JSON.stringify({ message: 'No API session is active' }), { status: 403 });
  }

  if (!(await checkRateLimitAllowedEdge(req, RateLimiters.PRICE))) {
    return new Response(JSON.stringify({ message: 'Rate limit exceeded' }), {
      status: 429,
    });
  }

  const query = new URL(req.url).searchParams;
  const chainId = Number.parseInt(query.get('chainId') as string, 10);

  const contract: Erc721TokenContract = {
    abi: ERC721_ABI,
    address: query.get('contractAddress') as Address,
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
    return new Response(JSON.stringify({ message: e.message }), {
      status: 500,
    });
  }
};

export default handler;
