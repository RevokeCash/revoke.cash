import { ADDRESS_ZERO } from 'lib/constants';
import blocksDB from 'lib/databases/blocks';
import type { useAllowances } from 'lib/hooks/ethereum/useAllowances';
import type { Nullable, SpenderRiskData, TransactionSubmitted } from 'lib/interfaces';
import { type Address, formatUnits, type PublicClient, type WalletClient, type WriteContractParameters } from 'viem';
import {
  deduplicateArray,
  isNullish,
  throwIfExcessiveGas,
  waitForTransactionConfirmation,
  writeContractUnlessExcessiveGas,
} from '.';
import analytics from './analytics';
import type { BatchType } from './batch-revoke';
import { getViemChainConfig, isTestnetChain } from './chains';
import { isNetworkError, isRateLimitError, isRevertedError, parseErrorMessage, stringifyError } from './errors';
import {
  type Erc20ApprovalEvent,
  type Erc721ApprovalEvent,
  type Erc721ApprovalForAllEvent,
  type Erc721TransferEvent,
  type TimeLog,
  type TokenEvent,
  TokenEventType,
} from './events';
import { formatFixedPointBigInt, parseFixedPointBigInt } from './formatting';
import { bigintMin, fixedPointMultiply } from './math';
import { getPermit2AllowancesFromApprovals, preparePermit2Approve } from './permit2';
import {
  createTokenContracts,
  type Erc20TokenContract,
  type Erc721TokenContract,
  getTokenData,
  hasZeroBalance,
  isErc721Contract,
  type TokenContract,
  type TokenData,
} from './tokens';

export interface TokenAllowanceData extends TokenData {
  payload?: AllowancePayload;
}

export type AllowancePayload = Erc721SingleAllowance | Erc721AllAllowance | Erc20Allowance | Permit2Erc20Allowance;

export enum AllowanceType {
  ERC721_SINGLE = 'ERC721_SINGLE',
  ERC721_ALL = 'ERC721_ALL',
  ERC20 = 'ERC20',
  PERMIT2 = 'PERMIT2',
}

export interface BaseAllowance {
  type: AllowanceType;
  spender: Address;
  // Spender data will be loaded separately (undefined until loaded, null if no data available)
  spenderData?: Nullable<SpenderRiskData>;
  lastUpdated: TimeLog;
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

export type OnUpdate = ReturnType<typeof useAllowances>['onUpdate'];

export const getAllowancesFromEvents = async (
  owner: Address,
  events: TokenEvent[],
  publicClient: PublicClient,
  chainId: number,
): Promise<TokenAllowanceData[]> => {
  const contracts = createTokenContracts(events, publicClient);

  // Look up token data for all tokens, add their lists of approvals
  const allowances = await Promise.all(
    contracts.map(async (contract) => {
      const contractEvents = events.filter((event) => event.token === contract.address);

      try {
        const [tokenData, unfilteredAllowances] = await Promise.all([
          getTokenData(contract, contractEvents, owner, chainId),
          getAllowancesForToken(contract, contractEvents, owner),
        ]);

        // Filter out zero-value allowances
        const allowances = unfilteredAllowances.filter((allowance) => !hasZeroAllowance(allowance, tokenData));

        if (allowances.length === 0) {
          return [tokenData as TokenAllowanceData];
        }

        const fullAllowances = allowances.map((allowance) => ({ ...tokenData, payload: allowance }));

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
  events: TokenEvent[],
  userAddress: Address,
): Promise<AllowancePayload[]> => {
  if (isErc721Contract(contract)) {
    const unlimitedAllowances = await getUnlimitedErc721AllowancesFromApprovals(contract, userAddress, events);
    const limitedAllowances = await getLimitedErc721AllowancesFromApprovals(contract, events);
    return [...limitedAllowances, ...unlimitedAllowances];
  }

  const regularAllowances = await getErc20AllowancesFromApprovals(contract, userAddress, events);
  const permit2Allowances = await getPermit2AllowancesFromApprovals(contract, userAddress, events);
  return [...regularAllowances, ...permit2Allowances];
};

export const getErc20AllowancesFromApprovals = async (
  contract: Erc20TokenContract,
  owner: Address,
  events: TokenEvent[],
): Promise<Erc20Allowance[]> => {
  const approvalEvents = events.filter((event) => event.type === TokenEventType.APPROVAL_ERC20);
  const deduplicatedApprovalEvents = deduplicateArray(
    approvalEvents,
    (event) => `${event.token}-${event.owner}-${event.payload.spender}`,
  );

  const allowances = await Promise.all(
    deduplicatedApprovalEvents.map((approval) => getErc20AllowanceFromApproval(contract, owner, approval)),
  );

  return allowances.filter((allowance) => !isNullish(allowance));
};

const getErc20AllowanceFromApproval = async (
  contract: Erc20TokenContract,
  owner: Address,
  approval: Erc20ApprovalEvent,
): Promise<Erc20Allowance | undefined> => {
  const { spender, amount: lastApprovedAmount } = approval.payload;

  // If the most recent approval event was for 0, then we know for sure that the allowance is 0
  // If not, we need to check the current allowance because we cannot determine the allowance from the event
  // since it may have been partially used (through transferFrom)
  if (lastApprovedAmount === 0n) return undefined;

  const [amount, lastUpdated] = await Promise.all([
    contract.publicClient.readContract({
      ...contract,
      functionName: 'allowance',
      args: [owner, spender],
    }),
    blocksDB.getTimeLog(contract.publicClient, approval.time),
  ]);

  return { type: AllowanceType.ERC20, spender, amount, lastUpdated };
};

export const getLimitedErc721AllowancesFromApprovals = async (
  contract: Erc721TokenContract,
  events: TokenEvent[],
): Promise<Erc721SingleAllowance[]> => {
  const singeTokenIdEvents = events.filter(
    (event) => event.type === TokenEventType.APPROVAL_ERC721 || event.type === TokenEventType.TRANSFER_ERC721,
  );

  // We only look at the tokenId, since a tokenId can only have one *limited* approval at a time
  const deduplicatedEvents = deduplicateArray(singeTokenIdEvents, (event) => `${event.token}-${event.payload.tokenId}`);

  const allowances = await Promise.all(
    deduplicatedEvents.map((event) => getLimitedErc721AllowanceFromApproval(contract, event)),
  );

  return allowances.filter((allowance) => !isNullish(allowance));
};

const getLimitedErc721AllowanceFromApproval = async (
  contract: Erc721TokenContract,
  event: Erc721ApprovalEvent | Erc721TransferEvent,
): Promise<Erc721SingleAllowance | undefined> => {
  // "limited" NFT approvals are reset on transfer, so if the NFT was transferred more recently than it was approved,
  // we know for sure that the allowance is revoked
  if (event.type === TokenEventType.TRANSFER_ERC721) return undefined;

  const { tokenId, spender } = event.payload;

  // If the most recent approval was a REVOKE (aka APPROVE address(0)), we know for sure that the allowance is revoked
  if (spender === ADDRESS_ZERO) return undefined;

  const [lastUpdated] = await Promise.all([blocksDB.getTimeLog(contract.publicClient, event.time)]);

  return { type: AllowanceType.ERC721_SINGLE, spender, tokenId, lastUpdated };
};

export const getUnlimitedErc721AllowancesFromApprovals = async (
  contract: Erc721TokenContract,
  owner: string,
  events: TokenEvent[],
): Promise<Erc721AllAllowance[]> => {
  const approvalForAllEvents = events.filter((event) => event.type === TokenEventType.APPROVAL_FOR_ALL);
  const deduplicatedApprovalForAllEvents = deduplicateArray(
    approvalForAllEvents,
    (event) => `${event.token}-${event.owner}-${event.payload.spender}`,
  );

  const allowances = await Promise.all(
    deduplicatedApprovalForAllEvents.map((approval) =>
      getUnlimitedErc721AllowanceFromApproval(contract, owner, approval),
    ),
  );

  return allowances.filter((allowance) => !isNullish(allowance));
};

const getUnlimitedErc721AllowanceFromApproval = async (
  contract: Erc721TokenContract,
  _owner: string,
  approval: Erc721ApprovalForAllEvent,
): Promise<Erc721AllAllowance | undefined> => {
  const { spender, approved: isApprovedForAll } = approval.payload;

  // If the most recent approval event was false, we know that the approval is revoked, and we don't need to check the chain
  if (!isApprovedForAll) return undefined;

  const [lastUpdated] = await Promise.all([blocksDB.getTimeLog(contract.publicClient, approval.time)]);

  return { type: AllowanceType.ERC721_ALL, spender, lastUpdated };
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

export const stripAllowanceData = (allowance: TokenAllowanceData): TokenAllowanceData => {
  const { contract, metadata, chainId, owner, balance, payload: _payload } = allowance;
  return { contract, metadata, chainId, owner, balance };
};

export const getAllowanceKey = (allowance: TokenAllowanceData) => {
  return `allowance-${allowance.contract.address}-${allowance.payload?.spender}-${(allowance.payload as any)?.tokenId}-${allowance.chainId}-${allowance.owner}`;
};

export const hasZeroAllowance = (allowance: AllowancePayload, tokenData: TokenAllowanceData) => {
  if (!allowance) return true;
  if (!isErc20Allowance(allowance)) return false;

  return (
    formatErc20Allowance(allowance.amount, tokenData?.metadata?.decimals, tokenData?.metadata?.totalSupply) === '0'
  );
};

export const revokeAllowance = async (
  walletClient: WalletClient,
  allowance: TokenAllowanceData,
  onUpdate: OnUpdate,
): Promise<TransactionSubmitted> => {
  if (!allowance.payload) throw new Error('Cannot revoke undefined allowance');

  if (isErc721Contract(allowance.contract)) {
    return revokeErc721Allowance(walletClient, allowance, onUpdate);
  }

  return revokeErc20Allowance(walletClient, allowance, onUpdate);
};

export const revokeErc721Allowance = async (
  walletClient: WalletClient,
  allowance: TokenAllowanceData,
  onUpdate: OnUpdate,
): Promise<TransactionSubmitted> => {
  const transactionRequest = await prepareRevokeErc721Allowance(allowance);
  const hash = await writeContractUnlessExcessiveGas(allowance.contract.publicClient, walletClient, transactionRequest);

  const waitForConfirmation = async () => {
    const transactionReceipt = await waitForTransactionConfirmation(hash, allowance.contract.publicClient);
    onUpdate(allowance, undefined);
    return transactionReceipt;
  };

  return { hash, confirmation: waitForConfirmation() };
};

export const revokeErc20Allowance = async (
  walletClient: WalletClient,
  allowance: TokenAllowanceData,
  onUpdate: OnUpdate,
): Promise<TransactionSubmitted> => {
  return updateErc20Allowance(walletClient, allowance, '0', onUpdate);
};

export const updateErc20Allowance = async (
  walletClient: WalletClient,
  allowance: TokenAllowanceData,
  newAmount: string,
  onUpdate: OnUpdate,
): Promise<TransactionSubmitted> => {
  const newAmountParsed = parseFixedPointBigInt(newAmount, allowance.metadata.decimals);
  const transactionRequest = await prepareUpdateErc20Allowance(allowance, newAmountParsed);

  const hash = await writeContractUnlessExcessiveGas(allowance.contract.publicClient, walletClient, transactionRequest);

  const waitForConfirmation = async () => {
    const transactionReceipt = await waitForTransactionConfirmation(hash, allowance.contract.publicClient);
    if (!transactionReceipt) return;

    const lastUpdated = await blocksDB.getTimeLog(allowance.contract.publicClient, {
      ...transactionReceipt,
      blockNumber: Number(transactionReceipt.blockNumber),
    });

    onUpdate(allowance, { amount: newAmountParsed, lastUpdated });

    return transactionReceipt;
  };

  return { hash, confirmation: waitForConfirmation() };
};

export const simulateRevokeAllowance = async (allowance: TokenAllowanceData): Promise<TokenAllowanceData> => {
  // If there is no allowance, we return the token data as-is
  if (!allowance.payload) return allowance;

  try {
    const preparedRevoke = await prepareRevokeAllowance(allowance);
    throwIfExcessiveGas(allowance.chainId, allowance.owner, preparedRevoke.gas ?? 0n);
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

export const trackRevokeTransaction = (allowance: TokenAllowanceData, batchType?: BatchType, newAmount?: string) => {
  if (isErc721Contract(allowance.contract)) {
    analytics.track('Revoked ERC721 allowance', {
      chainId: allowance.chainId,
      account: allowance.owner,
      spender: allowance.payload?.spender,
      tokenAddress: allowance.contract.address,
      tokenId: allowance.payload?.type === AllowanceType.ERC721_SINGLE ? allowance.payload.tokenId : undefined,
      isTestnet: isTestnetChain(allowance.chainId),
      batchType,
    });
  }

  const isRevoke = !newAmount || newAmount === '0';

  analytics.track(isRevoke ? 'Revoked ERC20 allowance' : 'Updated ERC20 allowance', {
    chainId: allowance.chainId,
    account: allowance.owner,
    spender: allowance.payload?.spender,
    tokenAddress: allowance.contract.address,
    amount: isRevoke ? undefined : newAmount,
    permit2: allowance.payload?.type === AllowanceType.PERMIT2,
    isTestnet: isTestnetChain(allowance.chainId),
    batchType,
  });
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
