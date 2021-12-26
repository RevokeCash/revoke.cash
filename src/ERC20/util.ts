import { BigNumber, Contract } from 'ethers'
import { providers as multicall } from '@0xsequence/multicall'
import { getAddress } from 'ethers/lib/utils'
import { TokenMapping } from '../common/interfaces'
import { toFloat, unpackResult } from '../common/util'
import { ERC20 } from '../common/abis'
import { DUMMY_ADDRESS, DUMMY_ADDRESS_2 } from '../common/constants';

export async function getTokenData(contract: Contract, ownerAddress: string, tokenMapping: TokenMapping = {}) {
  const tokenData = tokenMapping[getAddress(contract.address)]

    const multicallContract = new Contract(contract.address, ERC20, new multicall.MulticallProvider(contract.provider))
    const [totalSupplyBN, balance, symbol, decimals] = await Promise.all([
      unpackResult(multicallContract.functions.totalSupply()),
      unpackResult(multicallContract.functions.balanceOf(ownerAddress)),
      // Use the tokenlist symbol + decimals if present (simplifies handing MKR et al)
      tokenData?.symbol ?? unpackResult(multicallContract.functions.symbol()),
      tokenData?.decimals ?? unpackResult(multicallContract.functions.decimals()),
      throwIfNotErc20(multicallContract),
    ])

    const totalSupply = totalSupplyBN.toString()
    return { symbol, decimals, totalSupply, balance }
}

export function formatAllowance(allowance: string, decimals: number, totalSupply: string): string {
  const allowanceBN = BigNumber.from(allowance)
  const totalSupplyBN = BigNumber.from(totalSupply)

  if (allowanceBN.gt(totalSupplyBN)) {
    return 'Unlimited'
  }

  return toFloat(Number(allowanceBN), decimals)
}

async function throwIfNotErc20(contract: Contract) {
  // If the function isApprovedForAll does not exist it will throw (and is not ERC721)
  const [allowance] = await contract.functions.allowance(DUMMY_ADDRESS, DUMMY_ADDRESS_2)

  console.log(contract.address, allowance)

  // The only acceptable value for checking the allowance from 0x00...01 to 0x00...02 is 0
  // This could happen when the contract is not ERC20 but does have a fallback function
  if (allowance.toString() !== '0') {
    throw new Error('Response to allowance was not 0, indicating that this is not an ERC20 contract')
  }
}
