import axios from 'axios';
import { CHAIN_SELECT_MAINNETS, getChainName } from 'lib/utils/chains';

const getChainOrder = async () => {
  const { data: llamaData } = await axios.get('https://api.llama.fi/chains');
  const chains = CHAIN_SELECT_MAINNETS.map((chainId) => {
    const chainData = llamaData.find(
      (chain) =>
        chain.chainId === chainId ||
        chain.name === getChainName(chainId) ||
        chain.gecko_id === getChainName(chainId).toLowerCase(),
    );
    return [getChainName(chainId), chainId, Math.round(chainData?.tvl ?? 0)] as const;
  });

  chains.sort(([, , a], [, , b]) => b - a);

  chains.forEach((chain) => {
    console.log(chain[0], chain[2]);
  });
};

getChainOrder();
