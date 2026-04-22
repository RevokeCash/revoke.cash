import { PERMIT2_ABI } from '@revoke.cash/core/abis';
import {
  type Enriched,
  type EnrichedTokenEvent,
  hasTransfersFromOwnerAfterEvent,
  type Permit2Event,
  TokenEventType,
} from '@revoke.cash/core/events';
import type { Erc20TokenContract } from '@revoke.cash/core/tokens';
import { deduplicateArray } from '@revoke.cash/core/utils';
import { SECOND } from '@revoke.cash/core/utils/time';
import { type Address, type Chain, maxUint160 } from 'viem';
import { AllowanceType, type Permit2Erc20Allowance } from '.';

export const PERMIT2_ADDRESS: Address = '0x000000000022D473030F116dDEE9F6B43aC78BA3';

export const getPermit2AllowancesFromApprovals = async (
  contract: Erc20TokenContract,
  owner: Address,
  events: EnrichedTokenEvent[],
  blockNumber?: bigint,
  referenceTime?: number,
): Promise<Permit2Erc20Allowance[]> => {
  const permit2ApprovalEvents = events.filter((event) => event.type === TokenEventType.PERMIT2);

  const deduplicatedApprovalEvents = deduplicateArray(
    permit2ApprovalEvents,
    (event) =>
      `${event.chainId}-${event.token}-${event.owner}-${event.payload.spender}-${event.payload.permit2Address}`,
  );

  const allowances = await Promise.all(
    deduplicatedApprovalEvents.map((approval) =>
      getPermit2AllowanceFromApproval(contract, owner, approval, events, blockNumber, referenceTime),
    ),
  );

  return allowances.filter((allowance) => allowance !== undefined) as Permit2Erc20Allowance[];
};

const getPermit2AllowanceFromApproval = async (
  tokenContract: Erc20TokenContract,
  owner: Address,
  approval: Enriched<Permit2Event>,
  events: EnrichedTokenEvent[],
  blockNumber?: bigint,
  referenceTime?: number,
): Promise<Permit2Erc20Allowance | undefined> => {
  const { spender, amount: lastApprovedAmount, expiration, permit2Address } = approval.payload;
  if (lastApprovedAmount === 0n) return undefined;

  // Optimisation: if the approval is for the max uint160 value, the allowance is not decreased by transferFrom
  // (per Permit2 convention), so we can use the event value directly without an RPC call
  if (lastApprovedAmount === maxUint160) {
    return {
      type: AllowanceType.PERMIT2,
      spender,
      amount: lastApprovedAmount,
      lastUpdated: approval.time,
      expiration,
      permit2Address,
    };
  }

  // Optimisation: if there are no transfers from the owner after the approval, the allowance cannot have been
  // partially used, so we can use the event value directly without an RPC call
  if (!hasTransfersFromOwnerAfterEvent(owner, events, approval)) {
    return {
      type: AllowanceType.PERMIT2,
      spender,
      amount: lastApprovedAmount,
      lastUpdated: approval.time,
      expiration,
      permit2Address,
    };
  }

  const now = referenceTime ? referenceTime * SECOND : Date.now();
  if (expiration * SECOND <= now) return undefined;

  const permit2Allowance = await tokenContract.publicClient.readContract({
    address: permit2Address,
    abi: PERMIT2_ABI,
    functionName: 'allowance',
    args: [owner, tokenContract.address, spender],
    blockNumber,
  });

  const [amount] = permit2Allowance;

  return {
    type: AllowanceType.PERMIT2,
    spender,
    amount,
    lastUpdated: approval.time,
    expiration,
    permit2Address,
  };
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
