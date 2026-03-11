import { PERMIT2_ABI } from 'lib/abis';
import blocksDB from 'lib/databases/blocks';
import type { Address, Chain, WalletClient } from 'viem';
import { deduplicateArray, getWalletAddress, writeContractUnlessExcessiveGas } from '.';
import { AllowanceType, type Permit2Erc20Allowance } from './allowances';
import { type Permit2Event, type TokenEvent, TokenEventType } from './events';
import { SECOND } from './time';
import type { Erc20TokenContract } from './tokens';

export const PERMIT2_ADDRESS: Address = '0x000000000022D473030F116dDEE9F6B43aC78BA3';

export const getPermit2AllowancesFromApprovals = async (
  contract: Erc20TokenContract,
  owner: Address,
  events: TokenEvent[],
): Promise<Permit2Erc20Allowance[]> => {
  const permit2ApprovalEvents = events.filter((event) => event.type === TokenEventType.PERMIT2);

  const deduplicatedApprovalEvents = deduplicateArray(
    permit2ApprovalEvents,
    (event) => `${event.token}-${event.owner}-${event.payload.spender}-${event.payload.permit2Address}`,
  );

  const allowances = await Promise.all(
    deduplicatedApprovalEvents.map((approval) => getPermit2AllowanceFromApproval(contract, owner, approval)),
  );

  return allowances.filter((allowance) => allowance !== undefined) as Permit2Erc20Allowance[];
};

const getPermit2AllowanceFromApproval = async (
  tokenContract: Erc20TokenContract,
  owner: Address,
  approval: Permit2Event,
): Promise<Permit2Erc20Allowance | undefined> => {
  const { spender, amount: lastApprovedAmount, expiration, permit2Address } = approval.payload;
  if (lastApprovedAmount === 0n) return undefined;
  if (expiration * SECOND <= Date.now()) return undefined;

  const [permit2Allowance, lastUpdated] = await Promise.all([
    tokenContract.publicClient.readContract({
      address: permit2Address,
      abi: PERMIT2_ABI,
      functionName: 'allowance',
      args: [owner, tokenContract.address, spender],
    }),
    blocksDB.getTimeLog(tokenContract.publicClient, approval.time),
  ]);

  const [amount] = permit2Allowance;

  return {
    type: AllowanceType.PERMIT2,
    spender,
    amount,
    lastUpdated,
    expiration,
    permit2Address,
  };
};

export const permit2Approve = async (
  permit2Address: Address,
  walletClient: WalletClient,
  tokenContract: Erc20TokenContract,
  spender: Address,
  amount: bigint,
  expiration: number,
) => {
  const transactionRequest = await preparePermit2Approve(
    permit2Address,
    await getWalletAddress(walletClient),
    walletClient.chain,
    tokenContract,
    spender,
    amount,
    expiration,
  );

  return writeContractUnlessExcessiveGas(tokenContract.publicClient, walletClient, transactionRequest);
};

export const preparePermit2Approve = async (
  permit2Address: Address,
  account: Address,
  chain: Chain | undefined,
  tokenContract: Erc20TokenContract,
  spender: Address,
  amount: bigint,
  expiration: number,
) => {
  const transactionRequest = {
    address: permit2Address,
    abi: PERMIT2_ABI,
    functionName: 'approve' as const,
    args: [tokenContract.address, spender, amount, expiration] as const,
    account,
    chain,
    value: 0n as any as never, // Workaround for Gnosis Safe, TODO: remove when fixed
  };

  const gas = await tokenContract.publicClient.estimateContractGas(transactionRequest);

  return { ...transactionRequest, gas };
};
