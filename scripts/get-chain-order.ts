import { MULTICALL_ADDRESS } from 'lib/constants';
import ky from 'lib/ky';
import {
  CHAIN_SELECT_MAINNETS,
  CHAIN_SELECT_TESTNETS,
  createViemPublicClientForChain,
  getChainDeployedContracts,
  getChainExplorerUrl,
  getChainName,
  getChainPriceStrategy,
  getCorrespondingMainnetChainId,
} from 'lib/utils/chains';

const getChainOrder = async () => {
  const multicallData = await ky
    .get('https://raw.githubusercontent.com/mds1/multicall/main/deployments.json')
    .json<any[]>();

  const llamaData = await ky.get('https://api.llama.fi/chains').json<any[]>();

  const mainnetChains = await Promise.all(
    CHAIN_SELECT_MAINNETS.map((chainId) => mapChain(chainId, llamaData, multicallData)),
  );
  mainnetChains.sort(([, , a], [, , b]) => b - a);

  const testnetChains = await Promise.all(
    CHAIN_SELECT_TESTNETS.map((chainId) => mapChain(chainId, llamaData, multicallData, true)),
  );
  testnetChains.sort(([, , a], [, , b]) => b - a);

  console.log('MAINNETS:');
  mainnetChains.forEach((entry, index) => logChain(entry, index, CHAIN_SELECT_MAINNETS));
  console.log();
  console.log('Total mainnet chains:', mainnetChains.length);

  console.log('------------------------------');
  console.log();

  console.log('TESTNETS:');
  testnetChains.forEach((entry, index) => logChain(entry, index, CHAIN_SELECT_TESTNETS));
  console.log();
  console.log('Total testnet chains:', testnetChains.length);
};

const logChain = async (
  [chainName, chainId, tvl, hasMulticall]: readonly [string, number, number, boolean],
  index: number,
  reference: readonly number[],
) => {
  const hasPriceStrategyIcon = getChainPriceStrategy(chainId) ? '✅' : '❌';
  const indexDiff = String(index - reference.indexOf(chainId))
    .padStart(3, ' ')
    .padEnd(4, ' ');

  console.log(hasPriceStrategyIcon, indexDiff, chainName.padEnd(22), tvl);

  if (hasMulticall && !getChainDeployedContracts(chainId)) {
    const explorerUrl = getChainExplorerUrl(chainId);
    console.log('>>>>>>>>>>>> ADD MULTICALL', `(${explorerUrl}/address/${MULTICALL_ADDRESS})`);
  }
};

const mapChain = async (chainId: number, llamaData: any[], multicallData: any[], isTestnet?: boolean) => {
  const hasMulticall = await hasDeployedMulticall(chainId, multicallData);
  const mainnetChainId = isTestnet ? getCorrespondingMainnetChainId(chainId)! : chainId;

  const llamaChainData = llamaData.find(
    (chain) =>
      chain.chainId === mainnetChainId ||
      chain.name?.toLowerCase() === getChainName(mainnetChainId)?.toLowerCase() ||
      chain.gecko_id === getChainName(mainnetChainId).toLowerCase(),
  );

  return [getChainName(chainId), chainId, Math.round(llamaChainData?.tvl ?? 0), hasMulticall] as const;
};

const hasDeployedMulticall = async (chainId: number, multicallData: readonly any[]) => {
  const registeredMulticall = multicallData.find((data) => data.chainId === chainId);
  if (registeredMulticall) return true;

  const publicClient = createViemPublicClientForChain(chainId);
  const unregisteredMulticall = await publicClient.getCode({ address: MULTICALL_ADDRESS });

  if (unregisteredMulticall && unregisteredMulticall !== '0x') return true;

  return false;
};

getChainOrder();
