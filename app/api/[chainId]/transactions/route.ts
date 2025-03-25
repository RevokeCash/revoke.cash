// import { checkActiveSessionEdge, checkRateLimitAllowedEdge, RateLimiters } from 'lib/api/auth';
import { getTransactions } from 'lib/api/blockscan';
import type { NextRequest } from 'next/server';
import type { Hex } from 'viem';

interface Props {
  params: {
    chainId: string;
    address: string;
  };
}

export async function GET(req: NextRequest, { params }: Props) {
  //   if (!(await checkActiveSessionEdge(req))) {
  //     return new Response(JSON.stringify({ message: 'No API session is active' }), { status: 403 });
  //   }

  //   if (!(await checkRateLimitAllowedEdge(req, RateLimiters.PRICE))) {
  //     return new Response(JSON.stringify({ message: 'Rate limit exceeded' }), { status: 429 });
  //   }

  const chainId = Number.parseInt(params.chainId, 10);

  const searchParams = req.nextUrl.searchParams;
  const address = searchParams.get('address') as Hex;
  const startBlock = searchParams.get('startBlock');
  const endBlock = searchParams.get('endBlock');

  if (!address) {
    return new Response(JSON.stringify({ message: 'Address parameter is required' }), { status: 400 });
  }

  try {
    const transactions = await getTransactions(
      chainId,
      address,
      startBlock ? Number.parseInt(startBlock, 10) : 0,
      endBlock ? Number.parseInt(endBlock, 10) : 999999999,
    );

    return new Response(JSON.stringify({ transactions }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `max-age=${60 * 60}`,
        'Vercel-CDN-Cache-Control': `s-maxage=${60 * 60 * 24}`,
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ message: (e as unknown as Error).message }), { status: 500 });
  }
}
