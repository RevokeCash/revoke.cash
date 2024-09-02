import { PERMIT2_ABI } from 'lib/abis';
import blocksDB from 'lib/databases/blocks';
import { BaseAllowanceData, Erc20TokenContract, Log } from 'lib/interfaces';
import { Address, WalletClient, decodeEventLog } from 'viem';
import { deduplicateLogsByTopics, getWalletAddress, sortLogsChronologically } from '.';
import { SECOND } from './time';

export const PERMIT2_ADDRESS: Address = '0x000000000022D473030F116dDEE9F6B43aC78BA3';

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
  // Note: decodeEventLog return type is messed up since Viem v2
  const parsedEvent = decodeEventLog({
    abi: PERMIT2_ABI,
    data: approval.data,
    topics: approval.topics,
    strict: false,
  }) as any;
  const { spender, amount: lastApprovedAmount, expiration } = parsedEvent.args;

  // If the most recent approval event was for 0, or it was a lockdown, or its expiration is in the past, then we know
  // for sure that the allowance is 0. If not, we need to check the current allowance because we cannot determine the
  // allowance from the event since it may have been partially used (through transferFrom)
  if (parsedEvent.eventName === 'Lockdown' || lastApprovedAmount === 0n || expiration * SECOND <= Date.now()) {
    return undefined;
  }

  const [permit2Allowance, lastUpdated] = await Promise.all([
    tokenContract.publicClient.readContract({
      address: PERMIT2_ADDRESS,
      abi: PERMIT2_ABI,
      functionName: 'allowance',
      args: [owner, tokenContract.address, spender],
    }),
    blocksDB.getTimeLog(tokenContract.publicClient, approval),
  ]);

  const [amount] = permit2Allowance;

  return { spender, amount, lastUpdated, expiration };
};

// We don't need to do an excessive gas check for permit2 approvals since function is called on Permit2, not the token
export const permit2Approve = async (
  walletClient: WalletClient,
  tokenContract: Erc20TokenContract,
  spender: Address,
  amount: bigint,
  expiration: number,
) => {
  const transactionRequest = await preparePermit2Approve(walletClient, tokenContract, spender, amount, expiration);
  return walletClient.writeContract(transactionRequest);
};

export const preparePermit2Approve = async (
  walletClient: WalletClient,
  tokenContract: Erc20TokenContract,
  spender: Address,
  amount: bigint,
  expiration: number,
) => {
  const transactionRequest = {
    address: PERMIT2_ADDRESS,
    abi: PERMIT2_ABI,
    functionName: 'approve' as const,
    args: [tokenContract.address, spender, amount, expiration] as const,
    account: await getWalletAddress(walletClient),
    chain: walletClient.chain,
    value: 0n as any as never, // Workaround for Gnosis Safe, TODO: remove when fixed
  };

  const gas = await tokenContract.publicClient.estimateContractGas(transactionRequest);

  return { ...transactionRequest, gas };
};
