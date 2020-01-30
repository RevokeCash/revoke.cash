import { JsonRpcProvider } from 'ethers/providers'
import { Badge } from './abis'
import { Contract, ethers } from 'ethers'
import { BigNumberish } from 'ethers/utils'

export async function isRegistered(tokenAddress: string, provider: JsonRpcProvider): Promise<boolean> {
  const contractT2CR = new Contract('0xCb4Aae35333193232421E86Cd2E9b6C91f3B125F', Badge, provider.getSigner())
  const { status } = await contractT2CR.functions.getAddressInfo(tokenAddress)
  console.log(status)
  return status === 1
}

export function compareBN(a: BigNumberish, b: BigNumberish): number {
  a = ethers.utils.bigNumberify(a)
  b = ethers.utils.bigNumberify(b)
  const diff = a.sub(b);
  return diff.isZero() ? 0 : diff.lt(0) ? -1 : 1
}
