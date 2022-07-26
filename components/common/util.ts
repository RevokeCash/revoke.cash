import { Filter, Log } from '@ethersproject/abstract-provider';
import axios from 'axios';
import { ChainId, chains } from 'eth-chains';
import { BigNumber, BigNumberish, providers } from 'ethers';
import { getAddress } from 'ethers/lib/utils';
import {
  COVALENT_SUPPORTED_NETWORKS,
  DAPP_LIST_BASE_URL,
  ETHEREUM_LISTS_CONTRACTS,
  ETHERSCAN_SUPPORTED_NETWORKS,
  NODE_SUPPORTED_NETWORKS,
  PROVIDER_SUPPORTED_NETWORKS,
  TRUSTWALLET_BASE_URL,
} from './constants';
import { TokenFromList, TokenMapping, TokenStandard } from './interfaces';

// Check if a token is verified in the token mapping
export function isVerified(tokenAddress: string, tokenMapping?: TokenMapping): boolean {
  // If we don't know a verified token mapping, we skip checking verification
  if (!tokenMapping) return true;
  return tokenMapping[getAddress(tokenAddress)] !== undefined;
}

export function shortenAddress(address?: string): string {
  return address && `${address.substr(0, 6)}...${address.substr(address.length - 4, 4)}`;
}

export function compareBN(a: BigNumberish, b: BigNumberish): number {
  a = BigNumber.from(a);
  b = BigNumber.from(b);
  const diff = a.sub(b);
  return diff.isZero() ? 0 : diff.lt(0) ? -1 : 1;
}

// Look up an address' App Name using the dapp-contract-list
export async function addressToAppName(address: string, chainId?: number): Promise<string | undefined> {
  if (!chainId) return undefined;
  const name = (await getNameFromDappList(address, chainId)) ?? (await getNameFromEthereumList(address, chainId));
  return name;
}

async function getNameFromDappList(address: string, chainId: number): Promise<string | undefined> {
  try {
    const { data } = await axios.get(`${DAPP_LIST_BASE_URL}/${chainId}/${getAddress(address)}.json`);
    return data.appName;
  } catch {
    return undefined;
  }
}

async function getNameFromEthereumList(address: string, chainId: number): Promise<string | undefined> {
  try {
    const contractRes = await axios.get(`${ETHEREUM_LISTS_CONTRACTS}/contracts/${chainId}/${getAddress(address)}.json`);

    try {
      const projectRes = await axios.get(`${ETHEREUM_LISTS_CONTRACTS}/projects/${contractRes.data.project}.json`);
      return projectRes.data.name;
    } catch {}

    return contractRes.data.project;
  } catch {
    return undefined;
  }
}

export async function lookupEnsName(address: string, provider: providers.Provider): Promise<string | undefined> {
  try {
    return await provider.lookupAddress(address);
  } catch {
    return undefined;
  }
}

export function getExplorerUrl(chainId: number): string | undefined {
  const overrides = {
    [ChainId.EthereumTestnetRopsten]: 'https://ropsten.etherscan.io',
    [ChainId.EthereumTestnetKovan]: 'https://kovan.etherscan.io',
    [ChainId.SmartBitcoinCash]: 'https://smartscan.cash',
    [ChainId.Moonbeam]: 'https://moonbeam.moonscan.io',
    [ChainId.Moonriver]: 'https://moonriver.moonscan.io',
    [ChainId.CeloMainnet]: 'https://celoscan.io',
    [ChainId.CeloAlfajoresTestnet]: 'https://alfajores.celoscan.io',
    [ChainId.AuroraMainNet]: 'https://aurorascan.dev',
    [ChainId.AuroraTestNet]: 'https://testnet.aurorascan.dev',
    [ChainId.BitTorrentChainMainnet]: 'https://bttcscan.com',
    [ChainId.BitTorrentChainTestnet]: 'https://testnet.bttcscan.com',
    [ChainId.CloverMainnet]: 'https://clvscan.com',
    [ChainId.SyscoinTanenbaumTestnet]: 'https://tanenbaum.io',
    [57]: 'https://explorer.syscoin.org',
    [592]: 'https://blockscout.com/astar',
  };

  const [explorer] = chains.get(chainId)?.explorers ?? [];

  return overrides[chainId] ?? explorer?.url;
}

export function getRpcUrl(chainId: number, infuraKey: string = ''): string | undefined {
  // These are not in the eth-chains package, so manually got from chainlist.org
  const overrides = {
    [ChainId.ArbitrumOne]: 'https://arb1.arbitrum.io/rpc',
    [ChainId.Moonbeam]: 'https://moonbeam.public.blastapi.io',
    [ChainId.PalmMainnet]: 'https://palm-mainnet.infura.io/v3/3a961d6501e54add9a41aa53f15de99b',
    [ChainId.EthereumTestnetGörli]: `https://goerli.infura.io/v3/${infuraKey}`,
    [ChainId.EthereumTestnetKovan]: `https://kovan.infura.io/v3/${infuraKey}`,
  };

  const [rpcUrl] = chains.get(chainId)?.rpc ?? [];
  return overrides[chainId] ?? rpcUrl?.replace('${INFURA_API_KEY}', infuraKey);
}

export function getTrustWalletName(chainId: number): string | undefined {
  const mapping = {
    [ChainId.EthereumMainnet]: 'ethereum',
    [ChainId.BinanceSmartChainMainnet]: 'smartchain',
    [ChainId.EthereumClassicMainnet]: 'classic',
  };

  return mapping[chainId];
}

// TODO: Replace these with just chain ID rather than name (breaking)
export function getDappListName(chainId: number): string | undefined {
  const mapping = {
    [ChainId.EthereumMainnet]: 'ethereum',
    [ChainId.BinanceSmartChainMainnet]: 'smartchain',
    [ChainId.XDAIChain]: 'xdai',
    [ChainId.FuseMainnet]: 'fuse',
    [ChainId.PolygonMainnet]: 'matic',
    [ChainId.SmartBitcoinCash]: 'smartbch',
    [ChainId.ArbitrumOne]: 'arbitrum',
    [ChainId.AvalancheMainnet]: 'avalanche',
  };

  return mapping[chainId];
}

export function isProviderSupportedNetwork(chainId: number): boolean {
  return PROVIDER_SUPPORTED_NETWORKS.includes(chainId);
}

export function isBackendSupportedNetwork(chainId: number): boolean {
  return isCovalentSupportedNetwork(chainId) || isEtherscanSupportedNetwork(chainId) || isNodeSupportedNetwork(chainId);
}

export function isCovalentSupportedNetwork(chainId: number): boolean {
  return COVALENT_SUPPORTED_NETWORKS.includes(chainId);
}

export function isEtherscanSupportedNetwork(chainId: number): boolean {
  return ETHERSCAN_SUPPORTED_NETWORKS.includes(chainId);
}

export function isNodeSupportedNetwork(chainId: number): boolean {
  return NODE_SUPPORTED_NETWORKS.includes(chainId);
}

export async function getFullTokenMapping(chainId: number): Promise<TokenMapping | undefined> {
  const erc20Mapping = await getTokenMapping(chainId, 'ERC20');
  const erc721Mapping = await getTokenMapping(chainId, 'ERC721');

  if (erc20Mapping === undefined && erc721Mapping === undefined) return undefined;

  const fullMapping = { ...erc721Mapping, ...erc20Mapping };
  return fullMapping;
}

async function getTokenMapping(chainId: number, standard: TokenStandard = 'ERC20'): Promise<TokenMapping | undefined> {
  const url = getTokenListUrl(chainId, standard);

  try {
    const res = await axios.get(url);
    const tokens: TokenFromList[] = res.data.tokens;

    const tokenMapping = {};
    for (const token of tokens) {
      tokenMapping[getAddress(token.address)] = token;
    }

    return tokenMapping;
  } catch {
    // Fallback to 1inch token mapping
    return getTokenMappingFrom1inch(chainId);
  }
}

async function getTokenMappingFrom1inch(chainId: number): Promise<TokenMapping | undefined> {
  try {
    const { data: mapping } = await axios.get(`https://tokens.1inch.io/v1.1/${chainId}`);

    const tokenMapping = Object.fromEntries(
      Object.entries(mapping).map(([address, token]) => [getAddress(address), token])
    );

    return tokenMapping as TokenMapping;
  } catch {
    return undefined;
  }
}

function getTokenListUrl(chainId: number, standard: TokenStandard = 'ERC20'): string | undefined {
  const mapping = {
    ERC20: {
      [ChainId.HarmonyMainnetShard0]:
        'https://raw.githubusercontent.com/DefiKingdoms/community-token-list/main/src/defikingdoms-default.tokenlist.json',
      [ChainId.MetisAndromedaMainnet]:
        'https://raw.githubusercontent.com/MetisProtocol/metis/master/tokenlist/toptoken.json',
    },
    ERC721: {
      [ChainId.EthereumMainnet]:
        'https://raw.githubusercontent.com/vasa-develop/nft-tokenlist/master/mainnet_curated_tokens.json',
    },
  };

  return mapping[standard][chainId];
}

export function getTokenIcon(tokenAddress: string, chainId?: number, tokenMapping: TokenMapping = {}) {
  const normalisedAddress = getAddress(tokenAddress);

  // Retrieve a token icon from the token list if specified (filtering relative paths)
  const tokenData = tokenMapping[normalisedAddress];
  const iconFromMapping = !tokenData?.logoURI?.startsWith('/') && tokenData?.logoURI;

  // We pass chainId == udnefined if it's an NFT
  if (chainId === undefined) {
    return iconFromMapping || 'erc721.png';
  }

  // Fall back to TrustWallet/assets for logos
  const networkName = getTrustWalletName(chainId);
  const iconFromTrust = networkName && `${TRUSTWALLET_BASE_URL}/${networkName}/assets/${normalisedAddress}/logo.png`;

  return iconFromMapping || iconFromTrust || 'erc20.png';
}

export function toFloat(n: number, decimals: number): string {
  return (n / 10 ** decimals).toFixed(3);
}

export function fromFloat(floatString: string, decimals: number): string {
  const sides = floatString.split('.');
  if (sides.length === 1) return floatString.padEnd(decimals + floatString.length, '0');
  if (sides.length > 2) return '0';

  return sides[1].length > decimals
    ? sides[0] + sides[1].slice(0, decimals)
    : sides[0] + sides[1].padEnd(decimals, '0');
}

export const unpackResult = async (promise: Promise<any>) => (await promise)[0];

export const withFallback = async (promise: Promise<any>, fallback: any) => {
  try {
    return await promise;
  } catch {
    return fallback;
  }
};

export const convertString = async (promise: Promise<any>) => String(await promise);

export const emitAnalyticsEvent = (eventName: string) => {
  if (window && (window as any).sa_event) {
    (window as any).sa_event(eventName);
  }
};

export const getLogs = async (
  provider: Pick<providers.Provider, 'getLogs'>,
  baseFilter: Filter,
  fromBlock: number,
  toBlock: number,
  chainId: number,
  fallbackProvider?: Pick<providers.Provider, 'getLogs'>
): Promise<Log[]> => {
  if (isBackendSupportedNetwork(chainId)) {
    provider = new BackendProvider(chainId);
  }

  return getLogsFromProvider(provider, baseFilter, fromBlock, toBlock, fallbackProvider);
};

export const getLogsFromProvider = async (
  provider: Pick<providers.Provider, 'getLogs'>,
  baseFilter: Filter,
  fromBlock: number,
  toBlock: number,
  fallbackProvider?: Pick<providers.Provider, 'getLogs'>
): Promise<Log[]> => {
  try {
    const filter = { ...baseFilter, fromBlock, toBlock };
    try {
      const result = await provider.getLogs(filter);
      return result;
    } catch (error) {
      const errorMessage = error?.error?.message ?? error?.data?.message ?? error?.message;
      if (errorMessage !== 'query returned more than 10000 results') {
        throw error;
      }

      const middle = fromBlock + Math.floor((toBlock - fromBlock) / 2);
      const leftPromise = getLogsFromProvider(provider, baseFilter, fromBlock, middle);
      const rightPromise = getLogsFromProvider(provider, baseFilter, middle + 1, toBlock);
      const [left, right] = await Promise.all([leftPromise, rightPromise]);
      return [...left, ...right];
    }
  } catch (error) {
    // If a fallback provider is available, try again using that provider
    if (fallbackProvider) {
      return await getLogsFromProvider(fallbackProvider, baseFilter, fromBlock, toBlock);
    } else {
      throw error;
    }
  }
};

class BackendProvider {
  constructor(public chainId: number) {}

  async getLogs(filter: Filter): Promise<Log[]> {
    try {
      const { data } = await axios.post(`/api/${this.chainId}/logs`, filter);
      return data;
    } catch (error) {
      throw new Error(error?.response?.data ?? error?.message);
    }
  }
}

export const parseInputAddress = async (
  inputAddressOrName: string,
  provider: providers.Provider
): Promise<string | undefined> => {
  // If the input is an ENS name, validate it, resolve it and return it
  if (inputAddressOrName.endsWith('.eth')) {
    try {
      const address = await provider.resolveName(inputAddressOrName);
      return address ? address : undefined;
    } catch {
      return undefined;
    }
  }

  // If the input is an address, validate it and return it
  try {
    return getAddress(inputAddressOrName.toLowerCase());
  } catch {
    return undefined;
  }
};

export const getChainLogo = (chainId: number) => {
  const mapping = {
    [ChainId.EthereumMainnet]: '/logos/ethereum.png',
    [ChainId.EthereumTestnetRopsten]: '/logos/ethereum.png',
    [ChainId.EthereumTestnetRinkeby]: '/logos/ethereum.png',
    [ChainId.EthereumTestnetGörli]: '/logos/ethereum.png',
    [ChainId.EthereumTestnetKovan]: '/logos/ethereum.png',
    [ChainId.TelosEVMMainnet]: '/logos/telos.png',
    [ChainId.TelosEVMTestnet]: '/logos/telos.png',
    [ChainId.XDAIChain]: '/logos/gnosis-chain.png',
    [ChainId.MetisAndromedaMainnet]: '/logos/metis.png',
    [ChainId.MetisStardustTestnet]: '/logos/metis.png',
    [ChainId.SmartBitcoinCash]: '/logos/smartbch.png',
    [ChainId.SmartBitcoinCashTestnet]: '/logos/smartbch.png',
    [ChainId.FuseMainnet]: '/logos/fuse.png',
    [ChainId.FuseSparknet]: '/logos/fuse.png',
    [ChainId.BinanceSmartChainMainnet]: '/logos/binance.png',
    [ChainId.BinanceSmartChainTestnet]: '/logos/binance.png',
    [ChainId.PolygonMainnet]: '/logos/polygon.png',
    [ChainId.PolygonTestnetMumbai]: '/logos/polygon.png',
    [ChainId.AvalancheMainnet]: '/logos/avalanche.png',
    [ChainId.AvalancheFujiTestnet]: '/logos/avalanche.png',
    [ChainId.FantomOpera]: '/logos/fantom.png',
    [ChainId.FantomTestnet]: '/logos/fantom.png',
    [ChainId.ArbitrumOne]: '/logos/arbitrum.svg',
    [ChainId.ArbitrumTestnetRinkeby]: '/logos/arbitrum.svg',
    [ChainId.HuobiECOChainMainnet]: '/logos/heco.png',
    [ChainId.HuobiECOChainTestnet]: '/logos/heco.png',
    [ChainId.Moonbeam]: '/logos/moonbeam.png',
    [ChainId.Moonriver]: '/logos/moonriver.png',
    [ChainId.MoonbaseAlpha]: '/logos/moonbeam.png',
    [ChainId.CronosMainnetBeta]: '/logos/cronos.jpeg',
    [ChainId.RSKMainnet]: '/logos/rootstock.png',
    [ChainId.HarmonyMainnetShard0]: '/logos/harmony.png',
    [ChainId.IoTeXNetworkMainnet]: '/logos/iotex.png',
    [ChainId.KlaytnMainnetCypress]: '/logos/klaytn.png',
    [ChainId.PalmMainnet]: '/logos/palm.jpeg',
    [ChainId.OptimisticEthereum]: '/logos/optimism.jpeg',
    [9001]: '/logos/evmos.png',
    [ChainId.CeloMainnet]: '/logos/celo.png',
    [ChainId.CeloAlfajoresTestnet]: '/logos/celo.png',
    [ChainId.AuroraMainNet]: '/logos/aurora.jpeg',
    [ChainId.AuroraTestNet]: '/logos/aurora.jpeg',
    [ChainId.BitTorrentChainMainnet]: '/logos/btt.svg',
    [ChainId.BitTorrentChainTestnet]: '/logos/btt.svg',
    [ChainId.CloverMainnet]: '/logos/clover.jpeg',
    [ChainId.SyscoinTanenbaumTestnet]: '/logos/syscoin.png',
    [57]: '/logos/syscoin.png',
    [592]: '/logos/astar.png',
    [ChainId.Shiden]: '/logos/shiden.svg',
  };

  return mapping[chainId];
};
