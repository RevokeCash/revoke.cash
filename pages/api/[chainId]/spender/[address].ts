import { RateLimiters, checkActiveSessionEdge, checkRateLimitAllowedEdge } from 'lib/api/auth';
import { getSpenderData } from 'lib/utils/whois';
import { NextRequest } from 'next/server';

export const config = {
  runtime: 'edge',
  regions: ['iad1', 'cle1'],
};

const handler = async (req: NextRequest) => {
  if (req.method !== 'GET') return new Response(JSON.stringify({ message: 'Method not allowed' }), { status: 405 });

  if (!(await checkActiveSessionEdge(req))) {
    return new Response(JSON.stringify({ message: 'No API session is active' }), { status: 403 });
  }

  if (!(await checkRateLimitAllowedEdge(req, RateLimiters.SPENDER))) {
    return new Response(JSON.stringify({ message: 'Rate limit exceeded' }), { status: 429 });
  }

  const query = new URL(req.url).searchParams;
  const chainId = Number.parseInt(query.get('chainId') as string, 10);
  const address = query.get('address') as string;

  try {
    const spenderData = await getSpenderData(address, chainId);

    return new Response(JSON.stringify(spenderData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // 'Cache-Control': `max-age=${60 * 60}`, // 1 hour browser cache (mostly for localhost)
        'Vercel-CDN-Cache-Control': `s-maxage=${60 * 60 * 24}`, // 1 day (server CDN cache)
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ message: e.message }), { status: 500 });
  }
};

export default handler;
