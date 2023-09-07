import { ERC20_ABI, ERC721_ABI } from 'lib/abis';
import { TokenContract, TokenStandard } from 'lib/interfaces';
import { createViemPublicClientForChain, getChainRpcUrl } from 'lib/utils/chains';
import { getTokenMetadata } from 'lib/utils/tokens';
import { NextRequest } from 'next/server';
import { serialize } from 'wagmi';

export const config = {
  runtime: 'edge',
};

const handler = async (req: NextRequest) => {
  const query = new URL(req.url).searchParams;
  const chainId = Number(query.get('chainId'));
  const address = query.get('address');
  const type = query.get('type') as TokenStandard;

  const contract = {
    address,
    abi: type === 'ERC721' ? ERC721_ABI : ERC20_ABI,
    publicClient: createViemPublicClientForChain(chainId, getChainRpcUrl(chainId)),
  } as TokenContract;

  try {
    const metadata = await getTokenMetadata(contract, chainId);

    return new Response(serialize(metadata), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=0, s-maxage=604800',
      },
    });
  } catch (e) {
    return new Response(e.message, {
      status: 400,
      headers: {
        'Cache-Control': 'max-age=0, s-maxage=604800',
      },
    });
  }
};

export default handler;
