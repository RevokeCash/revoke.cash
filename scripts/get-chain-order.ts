import ky from 'lib/ky';
import {
  CHAIN_SELECT_MAINNETS,
  CHAIN_SELECT_TESTNETS,
  getChainDeployedContracts,
  getChainName,
  getChainPriceStrategy,
  getCorrespondingMainnetChainId,
} from 'lib/utils/chains';

const getChainOrder = async () => {
  const multicallData = await ky
    .get('https://raw.githubusercontent.com/mds1/multicall/main/deployments.json')
    .json<any[]>();
  const llamaData = await ky.get('https://api.llama.fi/chains').json<any[]>();

  const mainnetChains = CHAIN_SELECT_MAINNETS.map((chainId) => mapChain(chainId, llamaData));
  mainnetChains.sort(([, , a], [, , b]) => b - a);

  const testnetChains = CHAIN_SELECT_TESTNETS.map((chainId) => mapChain(chainId, llamaData, true));
  testnetChains.sort(([, , a], [, , b]) => b - a);

  console.log('MAINNETS:');
  mainnetChains.forEach((entry, index) => logChain(entry, index, CHAIN_SELECT_MAINNETS, multicallData));
  console.log();
  console.log('Total mainnet chains:', mainnetChains.length);

  console.log('------------------------------');
  console.log();

  console.log('TESTNETS:');
  testnetChains.forEach((entry, index) => logChain(entry, index, CHAIN_SELECT_TESTNETS, multicallData));
  console.log();
  console.log('Total testnet chains:', testnetChains.length);
};

const logChain = async (
  [chainName, chainId, tvl]: readonly [string, number, number],
  index: number,
  reference: readonly number[],
  multicallData: readonly any[],
) => {
  const hasPriceStrategyIcon = getChainPriceStrategy(chainId) ? '✅' : '❌';
  const indexDiff = String(index - reference.indexOf(chainId))
    .padStart(3, ' ')
    .padEnd(4, ' ');

  console.log(hasPriceStrategyIcon, indexDiff, chainName.padEnd(22), tvl);

  if (multicallData.find((data) => data.chainId === chainId) && !getChainDeployedContracts(chainId)) {
    console.log('>>>>>>>>>>>> ADD MULTICALL');
  }
};

const mapChain = (chainId: number, llamaData: any[], isTestnet?: boolean) => {
  const mainnetChainId = isTestnet ? getCorrespondingMainnetChainId(chainId)! : chainId;

  const llamaChainData = llamaData.find(
    (chain) =>
      chain.chainId === mainnetChainId ||
      chain.name?.toLowerCase() === getChainName(mainnetChainId)?.toLowerCase() ||
      chain.gecko_id === getChainName(mainnetChainId).toLowerCase(),
  );

  return [getChainName(chainId), chainId, Math.round(llamaChainData?.tvl ?? 0)] as const;
};

getChainOrder();
