import { BigNumber, Contract } from 'ethers'
import { getAddress } from 'ethers/lib/utils'
import { TokenMapping } from '../common/interfaces'
import { toFloat } from '../common/util'

export async function getTokenData(contract: Contract, ownerAddress: string, tokenMapping: TokenMapping = {}) {
  // Retrieve total supply and user balance from Infura
  const totalSupply = (await contract.functions.totalSupply()).toString()
  const balance = await contract.functions.balanceOf(ownerAddress)

  const tokenData = tokenMapping[getAddress(contract.address)]

  if (tokenData && tokenData.symbol && tokenData.decimals) {
    // Retrieve info from the token mapping if available
    const { symbol, decimals } = tokenData
    return { symbol, decimals, totalSupply, balance }
  } else {
    // If the token is not available in the token mapping, retrieve the info from Infura
    const symbol = await contract.symbol()
    const decimals = await contract.functions.decimals()
    return { symbol, decimals, totalSupply, balance }
  }
}

export function formatAllowance(allowance: string, decimals: number, totalSupply: string): string {
  const allowanceBN = BigNumber.from(allowance)
  const totalSupplyBN = BigNumber.from(totalSupply)

  if (allowanceBN.gt(totalSupplyBN)) {
    return 'Unlimited'
  }

  return toFloat(Number(allowanceBN), decimals)
}
