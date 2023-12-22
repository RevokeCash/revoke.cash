import { IRON_OPTIONS, checkRateLimitAllowedByIp, unsealSession } from 'lib/api/auth';
import { getNFTGetter } from 'lib/utils/chains';
import { NextRequest } from 'next/server';

export const config = {
  runtime: 'edge',
};

const handler = async (req: NextRequest) => {
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

  const getter = getNFTGetter(chainId);

  if (!getter) {
    return new Response(`Chain with ID ${chainId} is unsupported`, { status: 404 });
  }

  return getter
    .getFloorPriceUSD(contractAddress)
    .then((floorPrice) => {
      if (floorPrice < 0.01) return new Response('Not found', { status: 404 });

      console.log(`Floor price for ${contractAddress} is ${floorPrice}`);

      return new Response(
        JSON.stringify({
          floorPrice,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'CDN-Cache-Control': 's-maxage=3600',
          },
        },
      );
    })
    .catch((e) => {
      console.error(`Error occurred while fetching floor price for ${contractAddress}`, e);

      return new Response('No collection found for contractAddress', { status: 400 });
    });
};

export default handler;
