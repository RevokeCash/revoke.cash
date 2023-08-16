import { BigNumberish, Contract, utils } from 'ethers';
import { PERMIT2 } from 'lib/abis';
import blocksDB from 'lib/databases/blocks';
import { Log } from 'lib/interfaces';
import { deduplicateLogsByTopics, sortLogsChronologically } from '.';
import { convertString, unpackResult } from './promises';
import { SECOND } from './time';

export const PERMIT2_ADDRESS = '0x000000000022D473030F116dDEE9F6B43aC78BA3';
export const PERMIT2_INTERFACE = new utils.Interface(PERMIT2);

// Note that we merge all Permit2 related events (Approval, Permit, Lockdown) before calling this function
export const getPermit2AllowancesFromApprovals = async (contract: Contract, owner: string, approvals: Log[]) => {
  const sortedApprovals = sortLogsChronologically(approvals).reverse();

  // We disregard the topic[0] because semantically all Permit2 events have a similar meaning
  const deduplicatedApprovals = deduplicateLogsByTopics(sortedApprovals, [1, 2, 3]);

  const allowances = await Promise.all(
    deduplicatedApprovals.map((approval) => getPermit2AllowanceFromApproval(contract, owner, approval)),
  );

  return allowances;
};

const getPermit2AllowanceFromApproval = async (multicallContract: Contract, owner: string, approval: Log) => {
  const parsedEvent = PERMIT2_INTERFACE.parseLog(approval);
  const { spender, amount: lastApprovedAmount, expiration } = parsedEvent.args;

  const permit2Contract = new Contract(PERMIT2_ADDRESS, PERMIT2, multicallContract.provider);

  // If the most recent approval event was for 0, or it was a lockdown, or its expiration is in the past, then we know
  // for sure that the allowance is 0. If not, we need to check the current allowance because we cannot determine the
  // allowance from the event since it may have been partially used (through transferFrom)
  if (parsedEvent.name === 'Lockdown' || lastApprovedAmount.isZero() || expiration * SECOND <= Date.now()) {
    return { spender, amount: '0', lastUpdated: 0, transactionHash: approval.transactionHash };
  }

  const [amount, lastUpdated, transactionHash] = await Promise.all([
    convertString(unpackResult(permit2Contract.functions.allowance(owner, multicallContract.address, spender))),
    approval.timestamp ?? blocksDB.getBlockTimestamp(multicallContract.provider, approval.blockNumber),
    approval.transactionHash,
  ]);

  return { spender, amount, lastUpdated, transactionHash, expiration };
};

// We don't need to do an excessive gas check for permit2 approvals since function is called on Permit2, not the token
export const permit2Approve = async (
  tokenContract: Contract,
  spender: string,
  amount: BigNumberish,
  expiration: BigNumberish,
) => {
  const permit2Contract = new Contract(PERMIT2_ADDRESS, PERMIT2, tokenContract.signer);
  return permit2Contract.functions.approve(tokenContract.address, spender, amount, expiration);
};
