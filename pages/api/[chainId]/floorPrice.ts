import { IRON_OPTIONS, checkRateLimitAllowedByIp, unsealSession } from 'lib/api/auth';
import { getChainNFTSalesGetter } from 'lib/utils/chains';
import { NextFetchEvent, NextRequest } from 'next/server';

export const config = {
  runtime: 'edge',
};

const handler = async (req: NextRequest, context: NextFetchEvent) => {
  if (req.method !== 'GET') return new Response('Method not allowed', { status: 405 });

  const cookie = req.cookies.get(IRON_OPTIONS.cookieName);
  if (!cookie) return new Response('No API session is active', { status: 403 });

  const session = await unsealSession(cookie.value);
  if (!session.ip) return new Response('No API session is active', { status: 403 });

  if (!(await checkRateLimitAllowedByIp(session.ip))) {
    return new Response('Rate limit exceeded', { status: 429 });
  }

  const query = new URL(req.url).searchParams;
  const chainId = Number.parseInt(query.get('chainId') as string, 10);
  const contractAddress = query.get('contractAddress') as string;

  const getter = getChainNFTSalesGetter(chainId);

  if (!getter) {
    return new Response(`Chain with ID ${chainId} is unsupported`, { status: 404 });
  }

  return getter
    .getNFTFloorPrice(chainId, contractAddress)
    .catch((e) => {
      console.error(`Error occurred while fetching floor price for ${contractAddress}`, e);

      return new Response('Error occurred', { status: 500 });
    })
    .then((floorPrice) => {
      return new Response(
        JSON.stringify({
          floorPrice,
        }),
        { status: 200 },
      );
    });
};

export default handler;
