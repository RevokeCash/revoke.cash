import { RateLimiters, checkActiveSessionEdge, checkRateLimitAllowedEdge } from 'lib/api/auth';
import { getNFTGetter } from 'lib/utils/chains';
import { NextRequest } from 'next/server';

export const config = {
  runtime: 'edge',
};

const handler = async (req: NextRequest) => {
  if (req.method !== 'GET') return new Response('Method not allowed', { status: 405 });

  if (!(await checkActiveSessionEdge(req))) {
    return new Response(JSON.stringify({ message: 'No API session is active' }), { status: 403 });
  }

  if (!(await checkRateLimitAllowedEdge(req, RateLimiters.PRICE))) {
    return new Response(JSON.stringify({ message: 'Rate limit exceeded' }), { status: 429 });
  }

  const query = new URL(req.url).searchParams;
  const chainId = Number.parseInt(query.get('chainId') as string, 10);
  const contractAddress = query.get('contractAddress') as string;

  const getter = getNFTGetter(chainId);

  if (!getter) {
    return new Response(`Chain with ID ${chainId} is unsupported`, { status: 404 });
  }

  const floorPrice = await getter.getFloorPriceUSD(contractAddress).catch(() => 0);

  return new Response(
    JSON.stringify({
      floorPrice,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `max-age=${60 * 60}`, // 1 hour browser cache (mostly for localhost)
        'Vercel-CDN-Cache-Control': `s-maxage=${60 * 60 * 24}`, // 1 day (server CDN cache)
      },
    },
  );
};

export default handler;
