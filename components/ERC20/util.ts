import { BigNumber, Contract, providers } from 'ethers'
import { getAddress, hexDataSlice } from 'ethers/lib/utils'
import { TokenMapping } from '../common/interfaces'
import { Allowance } from './interfaces'
import { convertString, toFloat, unpackResult } from '../common/util'
import { DUMMY_ADDRESS, DUMMY_ADDRESS_2 } from '../common/constants';

export async function getAllowancesFromApprovals(contract: Contract, ownerAddress: string, approvals: providers.Log[]) {
  const deduplicatedApprovals = approvals
    .filter((approval, i) => i === approvals.findIndex(other => approval.topics[2] === other.topics[2]))

  let allowances: Allowance[] = await Promise.all(
    deduplicatedApprovals.map((approval) => getAllowanceFromApproval(contract, ownerAddress, approval))
  )

  return allowances
}

async function getAllowanceFromApproval(multicallContract: Contract, ownerAddress: string, approval: providers.Log) {
  const spender = getAddress(hexDataSlice(approval.topics[2], 12))
  const allowance = (await unpackResult(multicallContract.functions.allowance(ownerAddress, spender))).toString()

  return { spender, allowance }
}

export async function getTokenData(contract: Contract, ownerAddress: string, tokenMapping: TokenMapping = {}) {
  const tokenData = tokenMapping[getAddress(contract.address)]

  const [totalSupplyBN, balance, symbol, decimals] = await Promise.all([
    unpackResult(contract.functions.totalSupply()),
    convertString(unpackResult(contract.functions.balanceOf(ownerAddress))),
    // Use the tokenlist symbol + decimals if present (simplifies handing MKR et al)
    tokenData?.symbol ?? unpackResult(contract.functions.symbol()),
    tokenData?.decimals ?? unpackResult(contract.functions.decimals()),
    throwIfNotErc20(contract),
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

    // The only acceptable value for checking the allowance from 0x00...01 to 0x00...02 is 0
    // This could happen when the contract is not ERC20 but does have a fallback function
    if (allowance.toString() !== '0') {
      throw new Error('Response to allowance was not 0, indicating that this is not an ERC20 contract')
    }
}
