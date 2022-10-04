import { Filter, Log } from '@ethersproject/abstract-provider';
import axios from 'axios';
import { ChainId, chains } from 'eth-chains';
import { BigNumber, BigNumberish, providers } from 'ethers';
import { getAddress } from 'ethers/lib/utils';
import {
  COVALENT_SUPPORTED_CHAINS,
  DAPP_LIST_BASE_URL,
  ENS_RESOLUTION,
  ETHEREUM_LISTS_CONTRACTS,
  ETHERSCAN_SUPPORTED_CHAINS,
  NODE_SUPPORTED_CHAINS,
  PROVIDER_SUPPORTED_CHAINS,
  TRUSTWALLET_BASE_URL,
  UNS_RESOLUTION,
} from 'lib/constants';
import { Erc20TokenData, Erc721TokenData, TokenFromList, TokenMapping, TokenStandard } from 'lib/interfaces';

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
export async function addressToAppName(
  address: string,
  chainId?: number,
  openseaProxyAddress?: string
): Promise<string | undefined> {
  if (!chainId) return undefined;
  if (address === openseaProxyAddress) return 'OpenSea (old)';
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

export async function lookupEnsName(address: string): Promise<string | undefined> {
  try {
    return await ENS_RESOLUTION?.lookupAddress(address);
  } catch {
    return undefined;
  }
}

export async function resolveEnsName(ensName: string): Promise<string | undefined> {
  try {
    const address = await ENS_RESOLUTION?.resolveName(ensName);
    return address ? address : undefined;
  } catch {
    return undefined;
  }
}

export const resolveUnsName = async (unsName: string) => {
  try {
    const address = await UNS_RESOLUTION?.addr(unsName, 'ETH');
    return getAddress(address?.toLowerCase());
  } catch {
    return undefined;
  }
};

export const lookupUnsName = async (address: string) => {
  try {
    const name = await UNS_RESOLUTION?.reverse(address);
    return name;
  } catch {
    return undefined;
  }
};

export function getChainExplorerUrl(chainId: number): string | undefined {
  const overrides = {
    [ChainId.Ropsten]: 'https://ropsten.etherscan.io',
    [ChainId.Kovan]: 'https://kovan.etherscan.io',
    [ChainId.SmartBitcoinCash]: 'https://smartscan.cash',
    [ChainId.Moonbeam]: 'https://moonbeam.moonscan.io',
    [ChainId.Moonriver]: 'https://moonriver.moonscan.io',
    [ChainId.CeloMainnet]: 'https://celoscan.io',
    [ChainId.CeloAlfajoresTestnet]: 'https://alfajores.celoscan.io',
    [ChainId.AuroraMainnet]: 'https://aurorascan.dev',
    [ChainId.AuroraTestnet]: 'https://testnet.aurorascan.dev',
    [ChainId.BitTorrentChainMainnet]: 'https://bttcscan.com',
    [ChainId.BitTorrentChainTestnet]: 'https://testnet.bttcscan.com',
    [ChainId.CLVParachain]: 'https://clvscan.com',
    [ChainId.SyscoinTanenbaumTestnet]: 'https://tanenbaum.io',
    [ChainId.SyscoinMainnet]: 'https://explorer.syscoin.org',
    [ChainId.Astar]: 'https://blockscout.com/astar',
    [ChainId.Gnosis]: 'https://gnosisscan.io',
  };

  const [explorer] = chains.get(chainId)?.explorers ?? [];

  return overrides[chainId] ?? explorer?.url;
}

export function getChainRpcUrl(chainId: number, infuraKey: string = ''): string | undefined {
  // These are not in the eth-chains package, so manually got from chainlist.org
  const overrides = {
    [ChainId.ArbitrumOne]: 'https://arb1.arbitrum.io/rpc',
    [ChainId.Moonbeam]: 'https://moonbeam.public.blastapi.io',
    [ChainId.Kovan]: `https://kovan.infura.io/v3/${infuraKey}`,
    [ChainId.Sepolia]: `https://rpc.sepolia.dev`,
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

export function isProviderSupportedChain(chainId: number): boolean {
  return PROVIDER_SUPPORTED_CHAINS.includes(chainId);
}

export function isBackendSupportedChain(chainId: number): boolean {
  return isCovalentSupportedChain(chainId) || isEtherscanSupportedChain(chainId) || isNodeSupportedChain(chainId);
}

export function isCovalentSupportedChain(chainId: number): boolean {
  return COVALENT_SUPPORTED_CHAINS.includes(chainId);
}

export function isEtherscanSupportedChain(chainId: number): boolean {
  return ETHERSCAN_SUPPORTED_CHAINS.includes(chainId);
}

export function isNodeSupportedChain(chainId: number): boolean {
  return NODE_SUPPORTED_CHAINS.includes(chainId);
}

export async function getFullTokenMapping(chainId: number): Promise<TokenMapping | undefined> {
  if (!chainId) return undefined;

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
  const chainName = getTrustWalletName(chainId);
  const iconFromTrust = chainName && `${TRUSTWALLET_BASE_URL}/${chainName}/assets/${normalisedAddress}/logo.png`;

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

export const getLogs = async (
  provider: Pick<providers.Provider, 'getLogs'>,
  baseFilter: Filter,
  fromBlock: number,
  toBlock: number
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
      const leftPromise = getLogs(provider, baseFilter, fromBlock, middle);
      const rightPromise = getLogs(provider, baseFilter, middle + 1, toBlock);
      const [left, right] = await Promise.all([leftPromise, rightPromise]);
      return [...left, ...right];
    }
  } catch (error) {
    throw error;
  }
};

export const parseInputAddress = async (inputAddressOrName: string): Promise<string | undefined> => {
  // If the input is an ENS name, validate it, resolve it and return it
  if (inputAddressOrName.endsWith('.eth')) {
    return await resolveEnsName(inputAddressOrName);
  }

  // Other domain-like inputs are interpreted as Unstoppable Domains
  if (inputAddressOrName.includes('.')) {
    return await resolveUnsName(inputAddressOrName);
  }

  // If the input is an address, validate it and return it
  try {
    return getAddress(inputAddressOrName.toLowerCase());
  } catch {
    return undefined;
  }
};

export const getChainLogo = (chainId: number): string => {
  const mapping = {
    [ChainId.EthereumMainnet]: '/assets/images/vendor/chains/ethereum.png',
    [ChainId.Ropsten]: '/assets/images/vendor/chains/ethereum.png',
    [ChainId.Rinkeby]: '/assets/images/vendor/chains/ethereum.png',
    [ChainId.Goerli]: '/assets/images/vendor/chains/ethereum.png',
    [ChainId.Kovan]: '/assets/images/vendor/chains/ethereum.png',
    [ChainId.Sepolia]: '/assets/images/vendor/chains/ethereum.png',
    [ChainId.TelosEVMMainnet]: '/assets/images/vendor/chains/telos.png',
    [ChainId.TelosEVMTestnet]: '/assets/images/vendor/chains/telos.png',
    [ChainId.Gnosis]: '/assets/images/vendor/chains/gnosis-chain.png',
    [ChainId.MetisAndromedaMainnet]: '/assets/images/vendor/chains/metis.png',
    [ChainId.MetisStardustTestnet]: '/assets/images/vendor/chains/metis.png',
    [ChainId.SmartBitcoinCash]: '/assets/images/vendor/chains/smartbch.png',
    [ChainId.SmartBitcoinCashTestnet]: '/assets/images/vendor/chains/smartbch.png',
    [ChainId.FuseMainnet]: '/assets/images/vendor/chains/fuse.png',
    [ChainId.FuseSparknet]: '/assets/images/vendor/chains/fuse.png',
    [ChainId.BinanceSmartChainMainnet]: '/assets/images/vendor/chains/binance.png',
    [ChainId.BinanceSmartChainTestnet]: '/assets/images/vendor/chains/binance.png',
    [ChainId.PolygonMainnet]: '/assets/images/vendor/chains/polygon.png',
    [ChainId.Mumbai]: '/assets/images/vendor/chains/polygon.png',
    [ChainId['AvalancheC-Chain']]: '/assets/images/vendor/chains/avalanche.png',
    [ChainId.AvalancheFujiTestnet]: '/assets/images/vendor/chains/avalanche.png',
    [ChainId.FantomOpera]: '/assets/images/vendor/chains/fantom.png',
    [ChainId.FantomTestnet]: '/assets/images/vendor/chains/fantom.png',
    [ChainId.ArbitrumOne]: '/assets/images/vendor/chains/arbitrum.svg',
    [ChainId.ArbitrumRinkeby]: '/assets/images/vendor/chains/arbitrum.svg',
    [ChainId.HuobiECOChainMainnet]: '/assets/images/vendor/chains/heco.png',
    [ChainId.HuobiECOChainTestnet]: '/assets/images/vendor/chains/heco.png',
    [ChainId.Moonbeam]: '/assets/images/vendor/chains/moonbeam.png',
    [ChainId.Moonriver]: '/assets/images/vendor/chains/moonriver.png',
    [ChainId.MoonbaseAlpha]: '/assets/images/vendor/chains/moonbeam.png',
    [ChainId.CronosMainnetBeta]: '/assets/images/vendor/chains/cronos.jpeg',
    [ChainId.CronosTestnet]: '/assets/images/vendor/chains/cronos.jpeg',
    [ChainId.RSKMainnet]: '/assets/images/vendor/chains/rootstock.png',
    [ChainId.RSKTestnet]: '/assets/images/vendor/chains/rootstock.png',
    [ChainId.HarmonyMainnetShard0]: '/assets/images/vendor/chains/harmony.png',
    [ChainId.IoTeXNetworkMainnet]: '/assets/images/vendor/chains/iotex.png',
    [ChainId.KlaytnMainnetCypress]: '/assets/images/vendor/chains/klaytn.png',
    [ChainId.Palm]: '/assets/images/vendor/chains/palm.jpeg',
    [ChainId.Optimism]: '/assets/images/vendor/chains/optimism.jpeg',
    [ChainId.OptimisticEthereumTestnetGoerli]: '/assets/images/vendor/chains/optimism.jpeg',
    [ChainId.Evmos]: '/assets/images/vendor/chains/evmos.png',
    [ChainId.EvmosTestnet]: '/assets/images/vendor/chains/evmos.png',
    [ChainId.CeloMainnet]: '/assets/images/vendor/chains/celo.png',
    [ChainId.CeloAlfajoresTestnet]: '/assets/images/vendor/chains/celo.png',
    [ChainId.AuroraMainnet]: '/assets/images/vendor/chains/aurora.jpeg',
    [ChainId.AuroraTestnet]: '/assets/images/vendor/chains/aurora.jpeg',
    [ChainId.BitTorrentChainMainnet]: '/assets/images/vendor/chains/btt.svg',
    [ChainId.BitTorrentChainTestnet]: '/assets/images/vendor/chains/btt.svg',
    [ChainId.CLVParachain]: '/assets/images/vendor/chains/clover.jpeg',
    [ChainId.SyscoinTanenbaumTestnet]: '/assets/images/vendor/chains/syscoin.png',
    [ChainId.SyscoinMainnet]: '/assets/images/vendor/chains/syscoin.png',
    [ChainId.Astar]: '/assets/images/vendor/chains/astar.png',
    [ChainId.Shiden]: '/assets/images/vendor/chains/shiden.svg',
    [ChainId.GodwokenMainnet]: '/assets/images/vendor/chains/godwoken.png',
    [ChainId['GodwokenTestnet(V1.1)']]: '/assets/images/vendor/chains/godwoken.png',
  };

  return mapping[chainId] ?? '/assets/images/vendor/chains/ethereum.png';
};

export const getChainInfoUrl = (chainId: number): string | undefined => {
  const overrides = {
    [ChainId.Gnosis]: 'https://www.gnosischain.com/evm',
    [ChainId.CeloMainnet]: 'https://celo.org',
  };

  return overrides[chainId] ?? chains.get(chainId)?.infoURL;
};

export const getChainName = (chainId: number): string => {
  const overrides = {
    [ChainId.EthereumMainnet]: 'Ethereum',
    [ChainId.BinanceSmartChainMainnet]: 'Binance Smart Chain',
    [ChainId['AvalancheC-Chain']]: 'Avalanche',
    [ChainId.PolygonMainnet]: 'Polygon',
    [ChainId.ArbitrumOne]: 'Arbitrum',
    [ChainId.CronosMainnetBeta]: 'Cronos',
    [ChainId.FantomOpera]: 'Fantom',
    [ChainId.KlaytnMainnetCypress]: 'Klaytn',
    [ChainId.AuroraMainnet]: 'Aurora',
    [ChainId.CeloMainnet]: 'Celo',
    [ChainId.HuobiECOChainMainnet]: 'HECO',
    [ChainId.RSKMainnet]: 'RSK',
    [ChainId.MetisAndromedaMainnet]: 'Metis',
    [ChainId.TelosEVMMainnet]: 'Telos',
    [ChainId.IoTeXNetworkMainnet]: 'IoTeX',
    [ChainId.HarmonyMainnetShard0]: 'Harmony',
    [ChainId.GodwokenMainnet]: 'Godwoken',
    [ChainId.SmartBitcoinCash]: 'SmartBCH',
    [ChainId.FuseMainnet]: 'Fuse',
    [ChainId.SyscoinMainnet]: 'Syscoin',
    [ChainId.CLVParachain]: 'CLV',
    [ChainId.BitTorrentChainMainnet]: 'BTT Chain',
    [ChainId.Goerli]: 'Goerli',
    [ChainId.BinanceSmartChainTestnet]: 'BSC Testnet',
    [ChainId.AvalancheFujiTestnet]: 'Avalanche Fuji',
    [ChainId.Mumbai]: 'Polygon Mumbai',
    [ChainId.OptimisticEthereumTestnetGoerli]: 'Optimism Goerli',
    [ChainId.CeloAlfajoresTestnet]: 'Celo Alfajores',
    [ChainId.HuobiECOChainTestnet]: 'HECO Testnet',
    [ChainId.MetisStardustTestnet]: 'Metis Stardust',
    [ChainId.TelosEVMTestnet]: 'Telos Testnet',
    [ChainId.SmartBitcoinCashTestnet]: 'SmartBCH Testnet',
    [ChainId.SyscoinTanenbaumTestnet]: 'Syscoin Tenenbaum',
    [ChainId.BitTorrentChainTestnet]: 'BTTC Testnet',
  };

  return overrides[chainId] ?? chains.get(chainId)?.name ?? `Chain with ID ${chainId}`;
};

export const fallbackTokenIconOnError = (ev: any) => {
  ev.target.src = '/assets/images/fallback-token-icon.png';
};

export const isSpamToken = (token: Erc20TokenData | Erc721TokenData) => {
  const includesHttp = /https?:\/\//i.test(token.symbol);
  // This is not exhaustive, but we can add more TLDs to the list as needed, better than nothing
  const includesTld =
    /\.com|\.io|\.xyz|\.org|\.me|\.site|\.net|\.fi|\.vision|\.team|\.app|\.exchange|\.cash|\.finance/i.test(
      token.symbol
    );
  return includesHttp || includesTld;
};

export const getBalanceText = (symbol: string, balance: string, decimals?: number) => {
  if (balance === 'ERC1155') return `${symbol} (ERC1155)`;
  if (decimals !== undefined) return `${symbol}: ${toFloat(Number(balance), decimals)}`;
  return `${symbol}: ${String(balance)}`;
};

export const getChainNativeToken = (chainId: number): string => chains.get(chainId)?.nativeCurrency?.symbol ?? 'ETH';

export const getDefaultDonationAmount = (nativeToken: string): string => {
  const mapping = {
    ETH: '0.01',
    AETH: '0.01',
    RBTC: '0.001',
    BCH: '0.05',
    BNB: '0.05',
    xDAI: '25',
    MATIC: '10',
    AVAX: '0.25',
    TLOS: '25',
    METIS: '0.25',
    FUSE: '50',
    FTM: '20',
    ONE: '100',
    HT: '5',
    SDN: '25',
    GLMR: '5',
    MOVR: '0.25',
    IOTX: '250',
    KLAYTN: '25',
  };

  return mapping[nativeToken] ?? '1';
};
