import { BigNumber, Contract, providers } from 'ethers';
import { IERC20Allowance } from 'lib/interfaces';
import { toFloat, topicToAddress } from '.';
import { convertString, unpackResult } from './promises';

export async function getAllowancesFromApprovals(contract: Contract, ownerAddress: string, approvals: providers.Log[]) {
  const deduplicatedApprovals = approvals.filter(
    (approval, i) => i === approvals.findIndex((other) => approval.topics[2] === other.topics[2])
  );

  const allowances: IERC20Allowance[] = await Promise.all(
    deduplicatedApprovals.map((approval) => getAllowanceFromApproval(contract, ownerAddress, approval))
  );

  return allowances;
}

async function getAllowanceFromApproval(multicallContract: Contract, ownerAddress: string, approval: providers.Log) {
  const spender = topicToAddress(approval.topics[2]);
  const amount = await convertString(unpackResult(multicallContract.functions.allowance(ownerAddress, spender)));

  return { spender, amount };
}

export function formatAllowance(allowance: string, decimals: number, totalSupply: string): string {
  const allowanceBN = BigNumber.from(allowance);
  const totalSupplyBN = BigNumber.from(totalSupply);

  if (allowanceBN.gt(totalSupplyBN)) {
    return 'Unlimited';
  }

  return toFloat(Number(allowanceBN), decimals);
}
