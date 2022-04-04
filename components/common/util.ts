import axios from 'axios'
import { BigNumberish, BigNumber, providers } from 'ethers'
import { Filter, Log } from '@ethersproject/abstract-provider'
import { getAddress } from 'ethers/lib/utils'
import { chains, ChainId } from 'eth-chains'
import { DAPP_LIST_BASE_URL, TRUSTWALLET_BASE_URL } from './constants'
import { TokenFromList, TokenMapping, TokenStandard } from './interfaces'

// Check if a token is verified in the token mapping
export function isVerified(tokenAddress: string, tokenMapping?: TokenMapping): boolean {
  // If we don't know a verified token mapping, we skip checking verification
  if (!tokenMapping) return true
  return tokenMapping[getAddress(tokenAddress)] !== undefined;
}

export function shortenAddress(address?: string): string {
  return address && `${address.substr(0, 6)}...${address.substr(address.length - 4, 4)}`
}

export function compareBN(a: BigNumberish, b: BigNumberish): number {
  a = BigNumber.from(a)
  b = BigNumber.from(b)
  const diff = a.sub(b)
  return diff.isZero() ? 0 : diff.lt(0) ? -1 : 1
}

// Look up an address' App Name using the dapp-contract-list
export async function addressToAppName(address: string, networkName?: string): Promise<string | undefined> {
  if (!networkName) return undefined

  try {
    const { data } = await axios.get(`${DAPP_LIST_BASE_URL}/${networkName}/${getAddress(address)}.json`)
    return data.appName
  } catch {
    return undefined
  }
}

export async function lookupEnsName(address: string, provider: providers.Provider): Promise<string | undefined> {
  try {
    return await provider.lookupAddress(address)
  } catch {
    return undefined
  }
}

export function getExplorerUrl(chainId: number): string | undefined {
  const overrides = {
    [ChainId.EthereumTestnetRopsten]: 'https://ropsten.etherscan.io',
    [ChainId.EthereumTestnetKovan]: 'https://kovan.etherscan.io',
    [ChainId.SmartBitcoinCash]: 'https://smartscan.cash',
    [ChainId.Moonbeam]: 'https://moonbeam.moonscan.io',
    [ChainId.Moonriver]: 'https://moonriver.moonscan.io',
  }

  return overrides[chainId] ?? chains.get(chainId)?.explorers?.at(0)?.url;
}

export function getTrustWalletName(chainId: number): string | undefined {
  const mapping = {
    [ChainId.EthereumMainnet]: 'ethereum',
    [ChainId.BinanceSmartChainMainnet]: 'smartchain',
    [ChainId.EthereumClassicMainnet]: 'classic',
  }

  return mapping[chainId]
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
  }

  return mapping[chainId]
}

// TODO: Optimism, Celo, Cronos, Boba, ETC, Theta, Harmony, BTT, (ThunderCore), (EWT), (KCC),
// (Fusion), (CoinEx Chain), (Syscoin), (GoChain), (Okex Chain), (Wanchain), (POA)
// TODO (hard): Terra, Solana, Cardano, Polkadot, Kusama, Cosmos, Near, Tron, ICP, Tezos, Flow,

export function isProviderSupportedNetwork(chainId: number): boolean {
  const supportedNetworks = [
    ChainId.EthereumMainnet,
    ChainId.EthereumTestnetRopsten,
    ChainId.EthereumTestnetRinkeby,
    ChainId.EthereumTestnetGörli,
    ChainId.EthereumTestnetKovan,
    ChainId.TelosEVMMainnet,
    ChainId.TelosEVMTestnet,
    ChainId.XDAIChain,
    ChainId.MetisAndromedaMainnet,
    ChainId.MetisStardustTestnet,
    ChainId.SmartBitcoinCash,
    ChainId.SmartBitcoinCashTestnet,
    ChainId.FuseMainnet,
    ChainId.FuseSparknet,
  ]
  return supportedNetworks.includes(chainId);
}

export function isBackendSupportedNetwork(chainId: number): boolean {
  return isCovalentSupportedNetwork(chainId)
}

// We disable some of these chains because there's not a lot of demand for them, but they are intensive on the backend
// We also disable testnets for the same reason
export function isCovalentSupportedNetwork(chainId: number): boolean {
  const supportedNetworks = [
    ChainId.RSKMainnet,
    // ChainId.RSKTestnet,
    ChainId.BinanceSmartChainMainnet,
    // ChainId.BinanceSmartChainTestnet,
    ChainId.PolygonMainnet,
    // ChainId.PolygonTestnetMumbai,
    ChainId.AvalancheMainnet,
    // ChainId.AvalancheFujiTestnet,
    ChainId.FantomOpera,
    // ChainId.FantomTestnet,
    ChainId.HarmonyMainnetShard0,
    // ChainId.HarmonyTestnetShard0,
    ChainId.ArbitrumOne,
    // ChainId.ArbitrumTestnetRinkeby,
    // ChainId.HuobiECOChainMainnet,
    // ChainId.HuobiECOChainTestnet,
    // ChainId.Shiden,
    // ChainId.Moonbeam,
    // ChainId.Moonriver,
    // ChainId.MoonbaseAlpha,
    // ChainId.IoTeXNetworkMainnet,
    // ChainId.IoTeXNetworkTestnet,
    // ChainId.KlaytnMainnetCypress,
    // ChainId.KlaytnTestnetBaobab,
    // ChainId.EvmosTestnet,
    // ChainId.PalmMainnet,
    // ChainId.PalmTestnet,
    // ChainId.PolyjuiceTestnet,
  ]
  return supportedNetworks.includes(chainId);
}

export async function getFullTokenMapping(chainId: number): Promise<TokenMapping | undefined> {
  const erc20Mapping = await getTokenMapping(chainId, 'ERC20')
  const erc721Mapping = await getTokenMapping(chainId, 'ERC721')

  if (erc20Mapping === undefined && erc721Mapping === undefined) return undefined

  const fullMapping = { ...erc721Mapping, ...erc20Mapping }
  return fullMapping
}

async function getTokenMapping(chainId: number, standard: TokenStandard = 'ERC20'): Promise<TokenMapping | undefined> {
  const url = getTokenListUrl(chainId, standard)

  try {
    const res = await axios.get(url)
    const tokens: TokenFromList[] = res.data.tokens

    const tokenMapping = {}
    for (const token of tokens) {
      tokenMapping[getAddress(token.address)] = token
    }

    return tokenMapping
  } catch {
    // Fallback to 1inch token mapping
    return getTokenMappingFrom1inch(chainId)
  }
}

async function getTokenMappingFrom1inch(chainId: number): Promise<TokenMapping | undefined> {
  try {
    const { data: mapping } = await axios.get(`https://tokens.1inch.io/v1.1/${chainId}`);

    const tokenMapping = Object.fromEntries(
      Object.entries(mapping).map(([address, token]) => [getAddress(address), token])
    )

    return tokenMapping as TokenMapping;
  } catch {
    return undefined;
  }
}

function getTokenListUrl(chainId: number, standard: TokenStandard = 'ERC20'): string | undefined {
  const mapping = {
    ERC20: {
      [ChainId.HarmonyMainnetShard0]: 'https://raw.githubusercontent.com/DefiKingdoms/community-token-list/main/src/defikingdoms-default.tokenlist.json',
      [ChainId.MetisAndromedaMainnet]: 'https://raw.githubusercontent.com/MetisProtocol/metis/master/tokenlist/toptoken.json',
    },
    ERC721: {
      [ChainId.EthereumMainnet]: 'https://raw.githubusercontent.com/vasa-develop/nft-tokenlist/master/mainnet_curated_tokens.json'
    }
  }

  return mapping[standard][chainId]
}

export function getTokenIcon(tokenAddress: string, chainId: number, tokenMapping: TokenMapping = {}) {
  const normalisedAddress = getAddress(tokenAddress)

  // Retrieve a token icon from the token list if specified (filtering relative paths)
  const tokenData = tokenMapping[normalisedAddress]
  const iconFromMapping = !tokenData?.logoURI?.startsWith('/') && tokenData?.logoURI

  // Fall back to TrustWallet/assets for logos
  const networkName = getTrustWalletName(chainId)
  const iconFromTrust = networkName && `${TRUSTWALLET_BASE_URL}/${networkName}/assets/${normalisedAddress}/logo.png`

  const icon = iconFromMapping || iconFromTrust || 'erc20.png'

  return icon
}

export function toFloat(n: number, decimals: number): string {
  return (n / (10 ** decimals)).toFixed(3)
}

export function fromFloat(floatString: string, decimals: number): string {
  const sides = floatString.split('.')
  if (sides.length === 1) return floatString.padEnd(decimals + floatString.length, '0')
  if (sides.length > 2) return '0'

  return sides[1].length > decimals
    ? sides[0] + sides[1].slice(0, decimals)
    : sides[0] + sides[1].padEnd(decimals, '0')
}

export const unpackResult = async (promise: Promise<any>) => (await promise)[0]

export const withFallback = async (promise: Promise<any>, fallback: any) => {
  try {
    return await promise
  } catch {
    return fallback
  }
}

export const convertString = async (promise: Promise<any>) => String(await promise)

export const emitAnalyticsEvent = (eventName: string) => {
  if (window && (window as any).sa_event) {
    (window as any).sa_event(eventName)
  }
}

export const getLogs = async (
  provider: providers.Provider,
  baseFilter: Filter,
  fromBlock: number,
  toBlock: number,
  chainId: number
): Promise<Log[]> => {
  if (isProviderSupportedNetwork(chainId)) {
    return getLogsFromProvider(provider, baseFilter, fromBlock, toBlock)
  }

  return getLogsFromBackend(chainId, { ...baseFilter, fromBlock, toBlock })
};

export const getLogsFromProvider = async (
  provider: providers.Provider,
  baseFilter: Filter,
  fromBlock: number,
  toBlock: number
): Promise<Log[]> => {
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
};

export const getLogsFromBackend = async (chainId: number, filter: Filter): Promise<Log[]> => {
  const { data } = await axios.post(`/api/${chainId}/logs`, filter)
  return data
}

export const parseInputAddress = async (inputAddressOrName: string, provider: providers.Provider): Promise<string | undefined> => {
  // If the input is an ENS name, validate it, resolve it and return it
  if (inputAddressOrName.endsWith('.eth')) {
    try {
      const address = await provider.resolveName(inputAddressOrName)
      return address ? address : undefined
    } catch {
      return undefined
    }
  }

  // If the input is an address, validate it and return it
  try {
    return getAddress(inputAddressOrName.toLowerCase())
  } catch {
    return undefined
  }
}

export const splitBlockRangeInChunks = (chunks: [number, number][], chunkSize: number): [number, number][] => (
  chunks.flatMap(([from, to]) => (
    to - from < chunkSize
      ? [[from, to]]
      : splitBlockRangeInChunks([[from, from + chunkSize - 1], [from + chunkSize, to]], chunkSize)
  ))
)
