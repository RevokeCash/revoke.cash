import { getViemChainConfig } from '@revoke.cash/core/chains';
import { ADDRESS_ZERO } from '@revoke.cash/core/constants';
import {
  type Enriched,
  type EnrichedTokenEvent,
  type Erc20ApprovalEvent,
  type Erc721ApprovalEvent,
  type Erc721ApprovalForAllEvent,
  type Erc721TransferEvent,
  hasTransfersFromOwnerAfterEvent,
  isApprovalTokenEvent,
  type ResolvedTimeLog,
  TokenEventType,
} from '@revoke.cash/core/events';
import {
  createTokenContracts,
  type Erc20TokenContract,
  type Erc721TokenContract,
  getTokenData,
  hasZeroBalance,
  isErc721Contract,
  type TokenContract,
  type TokenData,
} from '@revoke.cash/core/tokens';
import type { Nullable } from '@revoke.cash/core/types';
import { deduplicateArray, isNullish } from '@revoke.cash/core/utils';
import {
  isNetworkError,
  isRateLimitError,
  isRevertedError,
  parseErrorMessage,
  stringifyError,
} from '@revoke.cash/core/utils/errors';
import { formatFixedPointBigInt } from '@revoke.cash/core/utils/formatting';
import { bigintMin, fixedPointMultiply } from '@revoke.cash/core/utils/math';
import { throwIfExcessiveGas } from '@revoke.cash/core/wallet';
import type { SpenderRiskData } from '@revoke.cash/core/whois';
import { type Address, formatUnits, maxUint256, type PublicClient, type WriteContractParameters } from 'viem';
import { getPermit2AllowancesFromApprovals, preparePermit2Approve } from './permit2';

export interface TokenAllowanceData extends TokenData {
  payload?: AllowancePayload;
}

export type AllowancePayload = Erc721SingleAllowance | Erc721AllAllowance | Erc20Allowance | Permit2Erc20Allowance;

export enum AllowanceType {
  ERC721_SINGLE = 'erc721_single',
  ERC721_ALL = 'erc721_all',
  ERC20 = 'erc20',
  PERMIT2 = 'permit2',
}

export interface BaseAllowance {
  type: AllowanceType;
  spender: Address;
  // Spender data will be loaded separately (undefined until loaded, null if no data available)
  spenderData?: Nullable<SpenderRiskData>;
  lastUpdated: ResolvedTimeLog;
  revokeError?: string;
  preparedRevoke?: WriteContractParameters;
}

export interface Erc721SingleAllowance extends BaseAllowance {
  type: AllowanceType.ERC721_SINGLE;
  tokenId: bigint;
}

export interface Erc721AllAllowance extends BaseAllowance {
  type: AllowanceType.ERC721_ALL;
}

export interface Erc20Allowance extends BaseAllowance {
  type: AllowanceType.ERC20;
  amount: bigint;
}

export interface Permit2Erc20Allowance extends BaseAllowance {
  type: AllowanceType.PERMIT2;
  amount: bigint;
  permit2Address: Address;
  expiration: number;
}

export const isErc20Allowance = (allowance?: AllowancePayload): allowance is Erc20Allowance | Permit2Erc20Allowance =>
  allowance?.type === AllowanceType.ERC20 || allowance?.type === AllowanceType.PERMIT2;

export const isErc721Allowance = (
  allowance?: AllowancePayload,
): allowance is Erc721SingleAllowance | Erc721AllAllowance =>
  allowance?.type === AllowanceType.ERC721_SINGLE || allowance?.type === AllowanceType.ERC721_ALL;

export const getAllowancesFromEvents = async (
  owner: Address,
  events: EnrichedTokenEvent[],
  publicClient: PublicClient,
  chainId: number,
  blockNumber?: bigint,
  referenceTime?: number,
): Promise<TokenAllowanceData[]> => {
  const contracts = createTokenContracts(events.filter(isApprovalTokenEvent), publicClient);

  // Look up token data for all tokens, add their lists of approvals
  const allowances = await Promise.all(
    contracts.map(async (contract) => {
      const contractEvents = events.filter((event) => event.token === contract.address);

      try {
        const [tokenData, unfilteredAllowances] = await Promise.all([
          getTokenData(contract, contractEvents, owner, chainId, blockNumber),
          getAllowancesForToken(contract, contractEvents, owner, blockNumber, referenceTime),
        ]);

        // Filter out zero-value allowances
        const allowances = unfilteredAllowances.filter((allowance) => !hasZeroAllowance(allowance, tokenData));

        if (allowances.length === 0) {
          return [tokenData as TokenAllowanceData];
        }

        const fullAllowances = allowances.map((allowance) => ({ ...tokenData, payload: allowance }));

        // Skip simulation in time machine mode — it runs against current state and is meaningless for historical snapshots
        if (blockNumber) return fullAllowances;

        // Simulate the revoke to see if it will revert
        const simulatedAllowances = await Promise.all(
          fullAllowances.map((allowance) => simulateRevokeAllowance(allowance)),
        );

        // Filter out allowances that run into an excessive gas limit error (since these are almost certainly spam tokens)
        // Note that other simulation revert errors are just passed on in the payload.revokeError
        const filteredAllowances = simulatedAllowances.filter(
          (allowance) => !allowance.payload?.revokeError?.includes('Excessive gas limit'),
        );

        return filteredAllowances;
      } catch (e) {
        if (isNetworkError(e)) throw e;
        if (isRateLimitError(e)) throw e;
        if (stringifyError(e)?.includes('Cannot decode zero data')) throw e;

        // If the call to getTokenData() fails, the token is not a standard-adhering token so
        // we do not include it in the token list.
        return [];
      }
    }),
  );

  // Filter out any zero-balance + zero-allowance tokens
  return allowances
    .flat()
    .filter((allowance) => allowance.payload || allowance.balance !== 'ERC1155')
    .filter((allowance) => allowance.payload || !hasZeroBalance(allowance.balance, allowance.metadata.decimals))
    .sort((a, b) => a.metadata.symbol.localeCompare(b.metadata.symbol));
};

export const getAllowancesForToken = async (
  contract: TokenContract,
  events: EnrichedTokenEvent[],
  userAddress: Address,
  blockNumber?: bigint,
  referenceTime?: number,
): Promise<AllowancePayload[]> => {
  if (isErc721Contract(contract)) {
    const unlimitedAllowances = getUnlimitedErc721AllowancesFromApprovals(events);
    const limitedAllowances = getLimitedErc721AllowancesFromApprovals(events);
    return [...limitedAllowances, ...unlimitedAllowances];
  }

  const regularAllowances = await getErc20AllowancesFromApprovals(contract, userAddress, events, blockNumber);
  const permit2Allowances = await getPermit2AllowancesFromApprovals(
    contract,
    userAddress,
    events,
    blockNumber,
    referenceTime,
  );
  return [...regularAllowances, ...permit2Allowances];
};

export const getErc20AllowancesFromApprovals = async (
  contract: Erc20TokenContract,
  owner: Address,
  events: EnrichedTokenEvent[],
  blockNumber?: bigint,
): Promise<Erc20Allowance[]> => {
  const approvalEvents = events.filter((event) => event.type === TokenEventType.APPROVAL_ERC20);
  const deduplicatedApprovalEvents = deduplicateArray(
    approvalEvents,
    (event) => `${event.chainId}-${event.token}-${event.owner}-${event.payload.spender}`,
  );

  const allowances = await Promise.all(
    deduplicatedApprovalEvents.map((approval) =>
      getErc20AllowanceFromApproval(contract, owner, approval, events, blockNumber),
    ),
  );

  return allowances.filter((allowance) => !isNullish(allowance));
};

const getErc20AllowanceFromApproval = async (
  contract: Erc20TokenContract,
  owner: Address,
  approval: Enriched<Erc20ApprovalEvent>,
  events: EnrichedTokenEvent[],
  blockNumber?: bigint,
): Promise<Erc20Allowance | undefined> => {
  const { spender, amount: lastApprovedAmount } = approval.payload;

  // If the most recent approval event was for 0, then we know for sure that the allowance is 0
  if (lastApprovedAmount === 0n) return undefined;

  // Optimisation: if the approval is for the max uint256 value, the allowance is not decreased by transferFrom
  // (per EIP-20 convention), so we can use the event value directly without an RPC call
  if (lastApprovedAmount === maxUint256) {
    return { type: AllowanceType.ERC20, spender, amount: lastApprovedAmount, lastUpdated: approval.time };
  }

  // Optimisation: if there are no transfers from the owner after the approval, the allowance cannot have been
  // partially used (through transferFrom), so we can use the event value directly without an RPC call
  if (!hasTransfersFromOwnerAfterEvent(owner, events, approval)) {
    return { type: AllowanceType.ERC20, spender, amount: lastApprovedAmount, lastUpdated: approval.time };
  }

  // Otherwise we need to check the current on-chain allowance because it may have been partially used
  const amount = await contract.publicClient.readContract({
    ...contract,
    functionName: 'allowance',
    args: [owner, spender],
    blockNumber,
  });

  return { type: AllowanceType.ERC20, spender, amount, lastUpdated: approval.time };
};

export const getLimitedErc721AllowancesFromApprovals = (events: EnrichedTokenEvent[]): Erc721SingleAllowance[] => {
  const singeTokenIdEvents = events.filter(
    (event) => event.type === TokenEventType.APPROVAL_ERC721 || event.type === TokenEventType.TRANSFER_ERC721,
  );

  // We only look at the tokenId, since a tokenId can only have one *limited* approval at a time
  const deduplicatedEvents = deduplicateArray(
    singeTokenIdEvents,
    (event) => `${event.chainId}-${event.token}-${event.payload.tokenId}`,
  );

  return deduplicatedEvents
    .map((event) => getLimitedErc721AllowanceFromApproval(event))
    .filter((allowance) => !isNullish(allowance));
};

const getLimitedErc721AllowanceFromApproval = (
  event: Enriched<Erc721ApprovalEvent> | Enriched<Erc721TransferEvent>,
): Erc721SingleAllowance | undefined => {
  // "limited" NFT approvals are reset on transfer, so if the NFT was transferred more recently than it was approved,
  // we know for sure that the allowance is revoked
  if (event.type === TokenEventType.TRANSFER_ERC721) return undefined;

  const { tokenId, spender } = event.payload;

  // If the most recent approval was a REVOKE (aka APPROVE address(0)), we know for sure that the allowance is revoked
  if (spender === ADDRESS_ZERO) return undefined;

  return { type: AllowanceType.ERC721_SINGLE, spender, tokenId, lastUpdated: event.time };
};

export const getUnlimitedErc721AllowancesFromApprovals = (events: EnrichedTokenEvent[]): Erc721AllAllowance[] => {
  const approvalForAllEvents = events.filter((event) => event.type === TokenEventType.APPROVAL_FOR_ALL);
  const deduplicatedApprovalForAllEvents = deduplicateArray(
    approvalForAllEvents,
    (event) => `${event.chainId}-${event.token}-${event.owner}-${event.payload.spender}`,
  );

  return deduplicatedApprovalForAllEvents
    .map((approval) => getUnlimitedErc721AllowanceFromApproval(approval))
    .filter((allowance) => !isNullish(allowance));
};

const getUnlimitedErc721AllowanceFromApproval = (
  approval: Enriched<Erc721ApprovalForAllEvent>,
): Erc721AllAllowance | undefined => {
  const { spender, approved: isApprovedForAll } = approval.payload;

  // If the most recent approval event was false, we know that the approval is revoked, and we don't need to check the chain
  if (!isApprovedForAll) return undefined;

  return { type: AllowanceType.ERC721_ALL, spender, lastUpdated: approval.time };
};

export const formatErc20Allowance = (allowance: bigint, decimals?: number, totalSupply?: bigint): string => {
  if (totalSupply && allowance > totalSupply) {
    return 'Unlimited';
  }

  return formatFixedPointBigInt(allowance, decimals);
};

export const getAllowanceI18nValues = (allowance: Pick<TokenAllowanceData, 'payload' | 'metadata'>) => {
  if (!allowance.payload) {
    const i18nKey = 'address.allowances.none';
    return { i18nKey };
  }

  if (isErc20Allowance(allowance.payload)) {
    const amount = formatErc20Allowance(
      allowance.payload.amount,
      allowance.metadata.decimals,
      allowance.metadata.totalSupply,
    );
    const i18nKey = amount === 'Unlimited' ? 'address.allowances.unlimited' : 'address.allowances.amount';
    const { symbol } = allowance.metadata;
    return { amount, i18nKey, symbol };
  }

  if (allowance.payload.type === AllowanceType.ERC721_SINGLE) {
    const i18nKey = 'address.allowances.token_id';
    const tokenId = allowance.payload.tokenId?.toString();
    return { tokenId, i18nKey };
  }

  const i18nKey = 'address.allowances.unlimited';
  return { i18nKey };
};

export const getAllowanceKey = (allowance: TokenAllowanceData) => {
  return `allowance-${allowance.chainId}-${allowance.owner}-${allowance.contract.address}-${allowance.payload?.spender}-${(allowance.payload as any)?.tokenId}`;
};

export const hasZeroAllowance = (allowance: AllowancePayload, tokenData: TokenAllowanceData) => {
  if (!allowance) return true;
  if (!isErc20Allowance(allowance)) return false;

  return (
    formatErc20Allowance(allowance.amount, tokenData?.metadata?.decimals, tokenData?.metadata?.totalSupply) === '0'
  );
};

export const simulateRevokeAllowance = async (allowance: TokenAllowanceData): Promise<TokenAllowanceData> => {
  // If there is no allowance, we return the token data as-is
  if (!allowance.payload) return allowance;

  try {
    const preparedRevoke = await prepareRevokeAllowance(allowance);
    throwIfExcessiveGas(allowance.chainId, preparedRevoke.gas ?? 0n, allowance.contract.address);
    return { ...allowance, payload: { ...allowance.payload, preparedRevoke } };
  } catch (e) {
    return { ...allowance, payload: { ...allowance.payload, revokeError: parseErrorMessage(e) } };
  }
};

export const prepareRevokeAllowance = async (allowance: TokenAllowanceData): Promise<WriteContractParameters> => {
  if (!allowance.payload) throw new Error('Cannot revoke undefined allowance');
  if (allowance.payload.preparedRevoke) return allowance.payload.preparedRevoke;

  if (isErc721Contract(allowance.contract)) {
    return prepareRevokeErc721Allowance(allowance);
  }

  return prepareRevokeErc20Allowance(allowance);
};

export const prepareRevokeErc721Allowance = async (allowance: TokenAllowanceData): Promise<WriteContractParameters> => {
  if (!allowance.payload) throw new Error('Cannot revoke undefined allowance');

  const chain = getViemChainConfig(allowance.chainId);

  if (allowance.payload.type === AllowanceType.ERC721_SINGLE) {
    const transactionRequest = {
      ...(allowance.contract as Erc721TokenContract),
      functionName: 'approve' as const,
      args: [ADDRESS_ZERO, allowance.payload.tokenId] as const,
      account: allowance.owner,
      chain,
      value: 0n as any as never, // Workaround for Gnosis Safe, TODO: remove when fixed
    };

    const gas = await allowance.contract.publicClient.estimateContractGas(transactionRequest);
    return { ...transactionRequest, gas };
  }

  const transactionRequest = {
    ...(allowance.contract as Erc721TokenContract),
    functionName: 'setApprovalForAll' as const,
    args: [allowance.payload.spender, false] as const,
    account: allowance.owner,
    chain,
    value: 0n as any as never, // Workaround for Gnosis Safe, TODO: remove when fixed
  };

  const gas = await allowance.contract.publicClient.estimateContractGas(transactionRequest);
  return { ...transactionRequest, gas };
};

export const prepareRevokeErc20Allowance = async (allowance: TokenAllowanceData): Promise<WriteContractParameters> => {
  return prepareUpdateErc20Allowance(allowance, 0n);
};

export const prepareUpdateErc20Allowance = async (
  allowance: TokenAllowanceData,
  newAmount: bigint,
): Promise<WriteContractParameters> => {
  if (!allowance.payload) throw new Error('Cannot update undefined allowance');

  if (isErc721Contract(allowance.contract) || isErc721Allowance(allowance.payload)) {
    throw new Error('Cannot update ERC721 allowances');
  }

  const differenceAmount = newAmount - allowance.payload.amount;
  if (differenceAmount === 0n) throw new Error('User rejected update transaction');

  const chain = getViemChainConfig(allowance.chainId);

  if (allowance.payload.type === AllowanceType.PERMIT2) {
    return preparePermit2Approve(
      allowance.payload.permit2Address,
      allowance.owner,
      chain,
      allowance.contract,
      allowance.payload.spender,
      newAmount,
      allowance.payload.expiration,
    );
  }

  const baseRequest = {
    ...allowance.contract,
    account: allowance.owner,
    chain,
    value: 0n as any as never, // Workaround for Gnosis Safe, TODO: remove when fixed
  };

  try {
    console.debug(`Calling contract.approve(${allowance.payload.spender}, ${newAmount})`);

    const transactionRequest = {
      ...baseRequest,
      functionName: 'approve' as const,
      args: [allowance.payload.spender, newAmount] as const,
    };

    const gas = await allowance.contract.publicClient.estimateContractGas(transactionRequest);
    return { ...transactionRequest, gas };
  } catch (e) {
    if (!isRevertedError(parseErrorMessage(e))) throw e;

    // Some tokens can only change approval with {increase|decrease}Approval
    if (differenceAmount > 0n) {
      console.debug(`Calling contract.increaseAllowance(${allowance.payload.spender}, ${differenceAmount})`);

      const transactionRequest = {
        ...baseRequest,
        functionName: 'increaseAllowance' as const,
        args: [allowance.payload.spender, differenceAmount] as const,
      };

      const gas = await allowance.contract.publicClient.estimateContractGas(transactionRequest);
      return { ...transactionRequest, gas };
    }

    console.debug(`Calling contract.decreaseAllowance(${allowance.payload.spender}, ${-differenceAmount})`);

    const transactionRequest = {
      ...baseRequest,
      functionName: 'decreaseAllowance' as const,
      args: [allowance.payload.spender, -differenceAmount] as const,
    };

    const gas = await allowance.contract.publicClient.estimateContractGas(transactionRequest);
    return { ...transactionRequest, gas };
  }
};

const calculateMaxAllowanceAmount = (allowance: TokenAllowanceData) => {
  if (allowance.balance === 'ERC1155') {
    throw new Error('ERC1155 tokens are not supported');
  }

  if (isErc20Allowance(allowance.payload)) return allowance.payload.amount;
  if (allowance.payload?.type === AllowanceType.ERC721_SINGLE) return 1n;

  return allowance.balance;
};

export const calculateValueAtRisk = (allowance: TokenAllowanceData): number | null => {
  if (!allowance.payload?.spender) return null;
  if (allowance.balance === 'ERC1155') return null;

  if (allowance.balance === 0n) return 0;
  if (isNullish(allowance.metadata.price)) return null;

  const allowanceAmount = calculateMaxAllowanceAmount(allowance);

  const amount = bigintMin(allowance.balance, allowanceAmount)!;
  const valueAtRisk = fixedPointMultiply(amount, allowance.metadata.price, allowance.metadata.decimals ?? 0);
  const float = Number(formatUnits(valueAtRisk, allowance.metadata.decimals ?? 0));

  return float;
};

export interface AllowanceUpdateProperties {
  amount?: bigint;
  lastUpdated?: ResolvedTimeLog;
}

export type OnUpdate = (allowance: TokenAllowanceData, updatedProperties?: AllowanceUpdateProperties) => Promise<void>;

export const applyRevokeToAllowances = (
  allowances: TokenAllowanceData[],
  allowance: TokenAllowanceData,
): TokenAllowanceData[] => {
  return allowances.filter((other) => !allowanceEquals(other, allowance));
};

export const applyUpdateToAllowances = (
  allowances: TokenAllowanceData[],
  allowance: TokenAllowanceData,
  updatedProperties: AllowanceUpdateProperties,
): TokenAllowanceData[] => {
  return allowances.map((other) => {
    if (!allowanceEquals(other, allowance)) return other;
    return { ...other, payload: { ...other.payload, ...updatedProperties } as AllowancePayload };
  });
};

export const contractEquals = (a: TokenAllowanceData, b: TokenAllowanceData) => {
  return a.contract.address === b.contract.address && a.chainId === b.chainId;
};

export const allowanceEquals = (a: TokenAllowanceData, b: TokenAllowanceData) => {
  if (!contractEquals(a, b)) return false;
  if (a.payload?.spender !== b.payload?.spender) return false;
  if (a.payload?.type !== b.payload?.type) return false;
  if (a.payload?.type === AllowanceType.ERC721_SINGLE && b.payload?.type === AllowanceType.ERC721_SINGLE) {
    return a.payload.tokenId === b.payload.tokenId;
  }

  return true;
};
