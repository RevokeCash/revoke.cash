import ky from 'lib/ky';
import { CHAIN_SELECT_MAINNETS, getChainName, getChainPriceStrategy } from 'lib/utils/chains';

const getChainOrder = async () => {
  const llamaData = await ky.get('https://api.llama.fi/chains').json<any>();
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

  chains.forEach(([chainName, chainId, tvl]) => {
    console.log(getChainPriceStrategy(chainId) ? '✅' : '❌', chainName, tvl);
  });
};

getChainOrder();
