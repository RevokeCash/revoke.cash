import axios from 'axios';
import { CHAIN_SELECT_MAINNETS, getChainName } from 'lib/utils/chains';

interface Chain {
  gecko_id: string;
  tvl: number;
  tokenSymbol: string;
  cmcId: string;
  name: string;
  chainId: number | null;
}

const getChainOrder = async () => {
  const { data: llamaData } = await axios.get<Chain[]>('https://api.llama.fi/chains');
  const chains = CHAIN_SELECT_MAINNETS.map((chainId) => {
    const chainData = llamaData.find((chain) => chain.chainId === chainId || chain.name === getChainName(chainId));
    return [getChainName(chainId), chainId, Math.round(chainData?.tvl ?? 0)] as const;
  });

  chains.sort(([, , a], [, , b]) => b - a);

  chains.forEach((chain) => {
    console.log(chain[0], chain[2]);
  });
};

getChainOrder();
