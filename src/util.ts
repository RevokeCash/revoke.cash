import axios from 'axios'
import { Contract } from 'ethers'
import { Provider } from 'ethers/providers'
import { BigNumberish, bigNumberify, getAddress } from 'ethers/utils'
import { Badge } from './abis'

export async function isRegistered(tokenAddress: string, provider: Provider): Promise<boolean> {
  const contractT2CR = new Contract('0xCb4Aae35333193232421E86Cd2E9b6C91f3B125F', Badge, provider)
  const { status } = await contractT2CR.functions.getAddressInfo(tokenAddress)
  return status === 1
}

export function compareBN(a: BigNumberish, b: BigNumberish): number {
  a = bigNumberify(a)
  b = bigNumberify(b)
  const diff = a.sub(b)
  return diff.isZero() ? 0 : diff.lt(0) ? -1 : 1
}

export async function addressToAppName(address: string): Promise<string | undefined> {
  try {
    console.log('requesting app name', address)
    const { data } = await axios.get(`https://raw.githubusercontent.com/rkalis/revoke.cash/master/dapp-contract-list/${getAddress(address)}.json`)
    return data.appName
  } catch (ignored) {
    return undefined
  }
}
