import { PERMIT2_ABI } from 'lib/abis';
import blocksDB from 'lib/databases/blocks';
import { BaseAllowanceData, Erc20TokenContract, Log } from 'lib/interfaces';
import { Address, WalletClient, decodeEventLog } from 'viem';
import { deduplicateLogsByTopics, getWalletAddress, sortLogsChronologically } from '.';
import { SECOND } from './time';

export const PERMIT2_ADDRESS = '0x000000000022D473030F116dDEE9F6B43aC78BA3';

// Note that we merge all Permit2 related events (Approval, Permit, Lockdown) before calling this function
export const getPermit2AllowancesFromApprovals = async (
  contract: Erc20TokenContract,
  owner: Address,
  approvals: Log[],
): Promise<BaseAllowanceData[]> => {
  const sortedApprovals = sortLogsChronologically(approvals).reverse();

  // We disregard the topic[0] because semantically all Permit2 events have a similar meaning
  const deduplicatedApprovals = deduplicateLogsByTopics(sortedApprovals, [1, 2, 3]);

  const allowances = await Promise.all(
    deduplicatedApprovals.map((approval) => getPermit2AllowanceFromApproval(contract, owner, approval)),
  );

  return allowances;
};

const getPermit2AllowanceFromApproval = async (
  tokenContract: Erc20TokenContract,
  owner: Address,
  approval: Log,
): Promise<BaseAllowanceData> => {
  const parsedEvent = decodeEventLog({ abi: PERMIT2_ABI, ...approval });
  const { spender, amount: lastApprovedAmount, expiration } = parsedEvent.args;

  // If the most recent approval event was for 0, or it was a lockdown, or its expiration is in the past, then we know
  // for sure that the allowance is 0. If not, we need to check the current allowance because we cannot determine the
  // allowance from the event since it may have been partially used (through transferFrom)
  if (parsedEvent.eventName === 'Lockdown' || lastApprovedAmount === 0n || expiration * SECOND <= Date.now()) {
    return { spender, amount: 0n, lastUpdated: 0, transactionHash: approval.transactionHash };
  }

  const [permit2Allowance, lastUpdated, transactionHash] = await Promise.all([
    tokenContract.publicClient.readContract({
      address: PERMIT2_ADDRESS,
      abi: PERMIT2_ABI,
      functionName: 'allowance',
      args: [owner, tokenContract.address, spender],
    }),
    approval.timestamp ?? blocksDB.getBlockTimestamp(tokenContract.publicClient, approval.blockNumber),
    approval.transactionHash,
  ]);

  const [amount] = permit2Allowance;

  return { spender, amount, lastUpdated, transactionHash, expiration };
};

// We don't need to do an excessive gas check for permit2 approvals since function is called on Permit2, not the token
export const permit2Approve = async (
  walletClient: WalletClient,
  tokenContract: Erc20TokenContract,
  spender: Address,
  amount: bigint,
  expiration: number,
) => {
  return walletClient.writeContract({
    address: PERMIT2_ADDRESS,
    abi: PERMIT2_ABI,
    functionName: 'approve',
    args: [tokenContract.address, spender, amount, expiration],
    account: await getWalletAddress(walletClient),
    chain: walletClient.chain,
  });
};
