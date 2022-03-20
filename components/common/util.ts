import axios from 'axios'
import { BigNumberish, BigNumber, providers } from 'ethers'
import { Filter, Log } from '@ethersproject/abstract-provider'
import { getAddress } from 'ethers/lib/utils'
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
  // Includes all Etherscan, BScScan, BlockScout, Matic, Avalanche explorers
  const mapping = {
    1: 'https://etherscan.io/address',
    3: 'https://ropsten.etherscan.io/address',
    4: 'https://rinkeby.etherscan.io/address',
    5: 'https://goerli.etherscan.io/address',
    6: 'https://blockscout.com/etc/kotti/address',
    10: 'https://optimistic.etherscan.io/address',
    30: 'https://blockscout.com/rsk/mainnet/address',
    42: 'https://kovan.etherscan.io/address',
    56: 'https://bscscan.com/address',
    61: 'https://blockscout.com/etc/mainnet/address',
    63: 'https://blockscout.com/etc/mordor/address',
    77: 'https://blockscout.com/poa/sokol/address',
    97: 'https://testnet.bscscan.com/address',
    99: 'https://blockscout.com/poa/core/address',
    100: 'https://blockscout.com/poa/xdai/address',
    122: 'https://explorer.fuse.io/address',
    128: 'https://hecoinfo.com/address',
    137: 'https://polygonscan.com/address',
    250: 'https://ftmscan.com/address',
    1088: 'https://andromeda-explorer.metis.io/address',
    1284: 'https://moonbeam.moonscan.io/address',
    1285: 'https://moonriver.moonscan.io/address',
    10000: 'https://smartscan.cash/address',
    42161: 'https://arbiscan.io/address',
    43113: 'https://snowtrace.io/address',
    43114: 'https://testnet.snowtrace.io/address',
    80001: 'https://mumbai.polygonscan.com/address',
    11297108109: 'https://explorer.palm.io/address',
  }

  return mapping[chainId]
}

export function getTrustWalletName(chainId: number): string | undefined {
  const mapping = {
    1: 'ethereum',
    56: 'smartchain',
    61: 'classic',
  }

  return mapping[chainId]
}

export function getDappListName(chainId: number): string | undefined {
  const mapping = {
    1: 'ethereum',
    56: 'smartchain',
    100: 'xdai',
    122: 'fuse',
    137: 'matic',
    10000: 'smartbch',
    42161: 'arbitrum',
    43114: 'avalanche',
  }

  return mapping[chainId]
}

// TODO: Optimism, Celo, Cronos, Boba, ETC, Theta, Harmony, BTT, (ThunderCore), (Fuse), (EWT), (KCC),
// (Fusion), (CoinEx Chain), (Syscoin), (GoChain), (Okex Chain), (Wanchain), (POA)
// TODO (hard): Terra, Solana, Cardano, Polkadot, Kusama, Cosmos, Near, Tron, ICP, Tezos, Flow,

export function isProviderSupportedNetwork(chainId: number): boolean {
  // ETH, Ropsten, Rinkeby, Goerli, Kovan, xDAI, Metis, SmartBCH, Arbitrum
  const supportedNetworks = [1, 3, 4, 5, 40, 42, 100, 122, 1088, 10000, 42161]
  return supportedNetworks.includes(chainId);
}

export function isBackendSupportedNetwork(chainId: number): boolean {
  return isCovalentSupportedNetwork(chainId)
}

export function isCovalentSupportedNetwork(chainId: number): boolean {
  // RSK, BSC, HECO, Polygon, Fantom, Shiden, Moonbeam, Moonriver, Iotex, Klaytn, Evmos, Avalanche, (Palm)
  const supportedNetworks = [30, 56, 128, 137, 250, 336, 1284, 1285, 4689, 8217, 9001, 43114, 11297108109]
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
      1088: 'https://raw.githubusercontent.com/MetisProtocol/metis/master/tokenlist/toptoken.json',
    },
    ERC721: {
      1: 'https://raw.githubusercontent.com/vasa-develop/nft-tokenlist/master/mainnet_curated_tokens.json'
    }
  }

  return mapping[standard][chainId]
}

export async function getTokenIcon(tokenAddress: string, chainId: number, tokenMapping: TokenMapping = {}) {
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
  const { data } = await axios.post(`/api/${chainId}/logs/`, filter)
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
    return getAddress(inputAddressOrName)
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
