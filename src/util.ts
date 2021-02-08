import axios from 'axios'
import { Contract, BigNumberish, BigNumber, providers } from 'ethers'
import { getAddress } from 'ethers/lib/utils'
import { TokensView } from './abis'
import { ADDRESS_ZERO, DAPP_LIST_BASE_URL, T2CR_ADDRESS, TOKENS_VIEW_ADDRESS, TRUSTWALLET_BASE_URL } from './constants'

// Check if a token is registered in the Kleros T2CR (ETH) or TrustWallet/assets (other chains)
export async function isRegistered(tokenAddress: string, provider: providers.Provider): Promise<boolean> {
  const { chainId } = await provider.getNetwork()
  const networkName = getTrustWalletName(chainId)

  // If we don't know about the network, we skip checking registration
  if (!networkName) return true

  // On mainnet ethereum we use Kleros T2CR as a decentralised registry
  if (networkName === 'ethereum') return await isRegisteredInKleros(tokenAddress, provider)

  // On other EVM chains we fall back to using TrustWallet/assets as a centralised registry
  return await isRegisteredInTrustWallet(tokenAddress, networkName);
}

async function isRegisteredInKleros(tokenAddress: string, provider: providers.Provider): Promise<boolean> {
  const tokensViewContract = new Contract(TOKENS_VIEW_ADDRESS, TokensView, provider)
  const [ tokenID ] = await tokensViewContract.functions.getTokensIDsForAddresses(T2CR_ADDRESS, [tokenAddress])
  return tokenID && tokenID[0] && tokenID[0] !== ADDRESS_ZERO
}

async function isRegisteredInTrustWallet(tokenAddress: string, networkName?: string): Promise<boolean> {
  if (!networkName) return false;

  try {
    await axios.get(`${TRUSTWALLET_BASE_URL}/${networkName}/assets/${tokenAddress}/info.json`)
    return true
  } catch {
    return false
  }
}

export function shortenAddress(address: string): string {
  return `${address.substr(0, 6)}...${address.substr(address.length - 4, 4)}`
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

export async function reverseLookup(address: string, provider: providers.Provider): Promise<string | undefined> {
  try {
    return await provider.lookupAddress(address)
  } catch {
    return undefined
  }
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
    137: 'matic',
  }

  return mapping[chainId]
}

export function getExplorerUrl(chainId: number): string | undefined {
  // Includes all Etherscan, BScScan, BlockScout, Matic explorers
  const mapping = {
    1: 'https://etherscan.io/address',
    3: 'https://ropsten.etherscan.io/address',
    4: 'https://rinkeby.etherscan.io/address',
    5: 'https://goerli.etherscan.io/address',
    6: 'https://blockscout.com/etc/kotti/address',
    30: 'https://blockscout.com/rsk/mainnet/address',
    42: 'https://kovan.etherscan.io/address',
    56: 'https://bscscan.com/address',
    61: 'https://blockscout.com/etc/mainnet/address',
    63: 'https://blockscout.com/etc/mordor/address',
    77: 'https://blockscout.com/poa/sokol/address',
    97: 'https://testnet.bscscan.com/address',
    99: 'https://blockscout.com/poa/core/address',
    100: 'https://blockscout.com/poa/xdai/address',
    137: 'https://explorer-mainnet.maticvigil.com/address',
    80001: 'https://explorer-mumbai.maticvigil.com/address'
  }

  return mapping[chainId]
}
