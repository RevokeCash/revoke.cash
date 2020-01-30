import { JsonRpcProvider } from 'ethers/providers'
import { Badge } from './abis'
import { Contract } from 'ethers'

export async function isRegistered(tokenAddress: string, provider: JsonRpcProvider): Promise<boolean> {
  const contractT2CR = new Contract('0xCb4Aae35333193232421E86Cd2E9b6C91f3B125F', Badge, provider.getSigner())
  const { status } = await contractT2CR.functions.getAddressInfo(tokenAddress)
  console.log(status)
  return status === 1
}
