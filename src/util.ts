import axios from 'axios'
import { Contract, BigNumberish, BigNumber, providers } from 'ethers'
import { getAddress } from 'ethers/lib/utils'
import { TokensView } from './abis'

const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000000000000000000000000000'
// const ERC20_BADGE_ADDRESS = '0xCb4Aae35333193232421E86Cd2E9b6C91f3B125F'
const T2CR_ADDRESS = '0xEbcf3bcA271B26ae4B162Ba560e243055Af0E679'
const TOKENS_VIEW_ADDRESS = '0xf9b9b5440340123B21BFf1dDAFE1ad6Feb9D6E7F'

// Check if a token is registered in the Kleros T2CR
export async function isRegistered(tokenAddress: string, provider: providers.Provider): Promise<boolean> {
  const tokensViewContract = new Contract(TOKENS_VIEW_ADDRESS, TokensView, provider)
  const [ tokenID ] = await tokensViewContract.functions.getTokensIDsForAddresses(T2CR_ADDRESS, [tokenAddress])
  return tokenID && tokenID[0] && tokenID[0] !== ADDRESS_ZERO
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
export async function addressToAppName(address: string): Promise<string | undefined> {
  try {
    const { data } = await axios.get(`https://raw.githubusercontent.com/rkalis/revoke.cash/master/dapp-contract-list/${getAddress(address)}.json`)
    return data.appName
  } catch {
    return undefined
  }
}
