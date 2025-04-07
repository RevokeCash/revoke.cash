import { ADDRESS_ZERO } from 'lib/constants';
import blocksDB from 'lib/databases/blocks';
import type { useAllowances } from 'lib/hooks/ethereum/useAllowances';
import type { TransactionSubmitted } from 'lib/interfaces';
import { type Address, type PublicClient, type WalletClient, type WriteContractParameters, formatUnits } from 'viem';
import { deduplicateArray, isNullish, waitForTransactionConfirmation, writeContractUnlessExcessiveGas } from '.';
import analytics from './analytics';
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
import {
  getLsp7AllowancesFromApprovals,
  prepareRevokeLsp7Allowance,
  revokeLsp7Allowance,
  updateLsp7Allowance,
} from './lukso';
import { bigintMin, fixedPointMultiply } from './math';
import { getPermit2AllowancesFromApprovals, preparePermit2Approve } from './permit2';
import {
  type Erc20TokenContract,
  type Erc721TokenContract,
  type Lsp7TokenContract,
  type TokenContract,
  type TokenData,
  createTokenContracts,
  getTokenData,
  hasZeroBalance,
} from './tokens';

export interface TokenAllowanceData<Payload extends AllowancePayload | undefined = AllowancePayload | undefined>
  extends TokenData {
  contract: Payload extends Erc721SingleAllowance
    ? Erc721TokenContract
    : Payload extends Erc721AllAllowance
      ? Erc721TokenContract
      : Payload extends Erc20Allowance
        ? Erc20TokenContract
        : Payload extends Permit2Erc20Allowance
          ? Erc20TokenContract
          : Payload extends Lsp7Allowance
            ? Lsp7TokenContract
            : TokenContract;
  payload: Payload;
}

export type AllowancePayload =
  | Erc721SingleAllowance
  | Erc721AllAllowance
  | Erc20Allowance
  | Permit2Erc20Allowance
  | Lsp7Allowance;

export enum AllowanceType {
  ERC721_SINGLE = 'ERC721_SINGLE',
  ERC721_ALL = 'ERC721_ALL',
  ERC20 = 'ERC20',
  PERMIT2 = 'PERMIT2',
  LSP7 = 'LSP7',
}

export interface BaseAllowance {
  type: AllowanceType;
  spender: Address;
  lastUpdated: TimeLog;
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

export interface Lsp7Allowance extends BaseAllowance {
  type: AllowanceType.LSP7;
  amount: bigint;
}

export const isErc20Allowance = (
  allowance?: TokenAllowanceData,
): allowance is TokenAllowanceData<Erc20Allowance | Permit2Erc20Allowance> =>
  allowance?.payload?.type === AllowanceType.ERC20 || allowance?.payload?.type === AllowanceType.PERMIT2;

export const isErc721Allowance = (
  allowance?: TokenAllowanceData,
): allowance is TokenAllowanceData<Erc721SingleAllowance | Erc721AllAllowance> =>
  allowance?.payload?.type === AllowanceType.ERC721_SINGLE || allowance?.payload?.type === AllowanceType.ERC721_ALL;

export const isLsp7Allowance = (allowance?: TokenAllowanceData): allowance is TokenAllowanceData<Lsp7Allowance> =>
  allowance?.payload?.type === AllowanceType.LSP7;

export const isFungibleAllowance = (
  allowance?: TokenAllowanceData,
): allowance is TokenAllowanceData<Erc20Allowance | Permit2Erc20Allowance | Lsp7Allowance> =>
  isErc20Allowance(allowance) || isLsp7Allowance(allowance);

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
        const fullAllowances = unfilteredAllowances.map((allowance) => ({ ...tokenData, payload: allowance }));
        const filteredAllowances = fullAllowances.filter((allowance) => !hasZeroAllowance(allowance));

        if (filteredAllowances.length === 0) {
          return [tokenData as TokenAllowanceData];
        }

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
  owner: Address,
): Promise<AllowancePayload[]> => {
  if (contract.tokenStandard === 'LSP7') {
    return getLsp7AllowancesFromApprovals(contract, events, owner);
  }

  if (contract.tokenStandard === 'ERC721') {
    const unlimitedAllowances = await getUnlimitedErc721AllowancesFromApprovals(contract, events, owner);
    const limitedAllowances = await getLimitedErc721AllowancesFromApprovals(contract, events);
    return [...limitedAllowances, ...unlimitedAllowances];
  }

  const regularAllowances = await getErc20AllowancesFromApprovals(contract, events, owner);
  const permit2Allowances = await getPermit2AllowancesFromApprovals(contract, events, owner);
  return [...regularAllowances, ...permit2Allowances];
};

export const getErc20AllowancesFromApprovals = async (
  contract: Erc20TokenContract,
  events: TokenEvent[],
  owner: Address,
): Promise<Erc20Allowance[]> => {
  const approvalEvents = events.filter((event) => event.type === TokenEventType.APPROVAL_ERC20);
  const deduplicatedApprovalEvents = deduplicateArray(
    approvalEvents,
    (a, b) => a.token === b.token && a.owner === b.owner && a.payload.spender === b.payload.spender,
  );

  const allowances = await Promise.all(
    deduplicatedApprovalEvents.map((approval) => getErc20AllowanceFromApproval(contract, approval, owner)),
  );

  return allowances.filter((allowance) => !isNullish(allowance));
};

const getErc20AllowanceFromApproval = async (
  contract: Erc20TokenContract,
  approval: Erc20ApprovalEvent,
  owner: Address,
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
  const deduplicatedEvents = deduplicateArray(
    singeTokenIdEvents,
    (a, b) => a.token === b.token && a.payload.tokenId === b.payload.tokenId,
  );

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
  events: TokenEvent[],
  owner: Address,
): Promise<Erc721AllAllowance[]> => {
  const approvalForAllEvents = events.filter((event) => event.type === TokenEventType.APPROVAL_FOR_ALL);
  const deduplicatedApprovalForAllEvents = deduplicateArray(
    approvalForAllEvents,
    (a, b) => a.token === b.token && a.owner === b.owner && a.payload.spender === b.payload.spender,
  );

  const allowances = await Promise.all(
    deduplicatedApprovalForAllEvents.map((approval) =>
      getUnlimitedErc721AllowanceFromApproval(contract, approval, owner),
    ),
  );

  return allowances.filter((allowance) => !isNullish(allowance));
};

const getUnlimitedErc721AllowanceFromApproval = async (
  contract: Erc721TokenContract,
  approval: Erc721ApprovalForAllEvent,
  _owner: Address,
): Promise<Erc721AllAllowance | undefined> => {
  const { spender, approved: isApprovedForAll } = approval.payload;

  // If the most recent approval event was false, we know that the approval is revoked, and we don't need to check the chain
  if (!isApprovedForAll) return undefined;

  const [lastUpdated] = await Promise.all([blocksDB.getTimeLog(contract.publicClient, approval.time)]);

  return { type: AllowanceType.ERC721_ALL, spender, lastUpdated };
};

export const formatFungibleAllowance = (allowance: bigint, decimals?: number, totalSupply?: bigint): string => {
  if (totalSupply && allowance > totalSupply) {
    return 'Unlimited';
  }

  return formatFixedPointBigInt(allowance, decimals);
};

export const getAllowanceI18nValues = (allowance: TokenAllowanceData) => {
  if (!allowance.payload) {
    const i18nKey = 'address.allowances.none';
    return { i18nKey };
  }

  if (isFungibleAllowance(allowance)) {
    const amount = formatFungibleAllowance(
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
  return { ...allowance, payload: undefined };
};

export const getAllowanceKey = (allowance: TokenAllowanceData) => {
  return `allowance-${allowance.contract.address}-${allowance.payload?.spender}-${(allowance.payload as any)?.tokenId}-${allowance.chainId}-${allowance.owner}`;
};

export const hasZeroAllowance = (allowance: TokenAllowanceData) => {
  if (!allowance.payload) return true;
  if (!isFungibleAllowance(allowance)) return false;

  const formattedAllowance = formatFungibleAllowance(
    allowance.payload.amount,
    allowance.metadata.decimals,
    allowance.metadata.totalSupply,
  );

  return formattedAllowance === '0';
};

export const revokeAllowance = async (
  walletClient: WalletClient,
  allowance: TokenAllowanceData,
  onUpdate: OnUpdate,
): Promise<TransactionSubmitted> => {
  if (isErc721Allowance(allowance)) {
    return revokeErc721Allowance(walletClient, allowance, onUpdate);
  }

  if (isLsp7Allowance(allowance)) {
    return revokeLsp7Allowance(walletClient, allowance, onUpdate);
  }

  if (isErc20Allowance(allowance)) {
    return revokeErc20Allowance(walletClient, allowance, onUpdate);
  }

  throw new Error('Cannot revoke undefined allowance');
};

export const revokeErc721Allowance = async (
  walletClient: WalletClient,
  allowance: TokenAllowanceData<Erc721SingleAllowance | Erc721AllAllowance>,
  onUpdate: OnUpdate,
): Promise<TransactionSubmitted> => {
  const transactionRequest = await prepareRevokeErc721Allowance(walletClient, allowance);
  const hash = await writeContractUnlessExcessiveGas(allowance.contract.publicClient, walletClient, transactionRequest);

  const waitForConfirmation = async () => {
    const transactionReceipt = await waitForTransactionConfirmation(hash, allowance.contract.publicClient);
    onUpdate(allowance, undefined);
    return transactionReceipt;
  };

  return { hash, confirmation: waitForConfirmation() };
};

export const updateAllowance = async (
  walletClient: WalletClient,
  allowance: TokenAllowanceData,
  newAmount: string,
  onUpdate: OnUpdate,
) => {
  if (isErc721Allowance(allowance)) {
    throw new Error('Cannot update ERC721 allowances');
  }

  if (isErc20Allowance(allowance)) {
    return updateErc20Allowance(walletClient, allowance, newAmount, onUpdate);
  }

  if (isLsp7Allowance(allowance)) {
    return updateLsp7Allowance(walletClient, allowance, newAmount, onUpdate);
  }

  throw new Error('Cannot update undefined allowance');
};

export const revokeErc20Allowance = async (
  walletClient: WalletClient,
  allowance: TokenAllowanceData<Erc20Allowance | Permit2Erc20Allowance>,
  onUpdate: OnUpdate,
): Promise<TransactionSubmitted> => {
  return updateErc20Allowance(walletClient, allowance, '0', onUpdate);
};

export const updateErc20Allowance = async (
  walletClient: WalletClient,
  allowance: TokenAllowanceData<Erc20Allowance | Permit2Erc20Allowance>,
  newAmount: string,
  onUpdate: OnUpdate,
): Promise<TransactionSubmitted> => {
  const newAmountParsed = parseFixedPointBigInt(newAmount, allowance.metadata.decimals);
  const transactionRequest = await prepareUpdateErc20Allowance(walletClient, allowance, newAmountParsed);

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

export const prepareRevokeAllowance = async (
  walletClient: WalletClient,
  allowance: TokenAllowanceData,
): Promise<WriteContractParameters> => {
  if (!allowance.payload) throw new Error('Cannot revoke undefined allowance');

  if (isErc721Allowance(allowance)) {
    return prepareRevokeErc721Allowance(walletClient, allowance);
  }

  if (isErc20Allowance(allowance)) {
    return prepareRevokeErc20Allowance(walletClient, allowance);
  }

  if (isLsp7Allowance(allowance)) {
    return prepareRevokeLsp7Allowance(walletClient, allowance);
  }

  throw new Error('Cannot revoke undefined allowance');
};

export const prepareRevokeErc721Allowance = async (
  walletClient: WalletClient,
  allowance: TokenAllowanceData<Erc721SingleAllowance | Erc721AllAllowance>,
): Promise<WriteContractParameters> => {
  if (!allowance.payload) throw new Error('Cannot revoke undefined allowance');

  if (allowance.payload.type === AllowanceType.ERC721_SINGLE) {
    const transactionRequest = {
      ...(allowance.contract as Erc721TokenContract),
      functionName: 'approve' as const,
      args: [ADDRESS_ZERO, allowance.payload.tokenId] as const,
      account: allowance.owner,
      chain: walletClient.chain,
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
    chain: walletClient.chain,
    value: 0n as any as never, // Workaround for Gnosis Safe, TODO: remove when fixed
  };

  const gas = await allowance.contract.publicClient.estimateContractGas(transactionRequest);
  return { ...transactionRequest, gas };
};

export const prepareRevokeErc20Allowance = async (
  walletClient: WalletClient,
  allowance: TokenAllowanceData<Erc20Allowance | Permit2Erc20Allowance>,
): Promise<WriteContractParameters> => {
  return prepareUpdateErc20Allowance(walletClient, allowance, 0n);
};

export const prepareUpdateErc20Allowance = async (
  walletClient: WalletClient,
  allowance: TokenAllowanceData<Erc20Allowance | Permit2Erc20Allowance>,
  newAmount: bigint,
): Promise<WriteContractParameters> => {
  const differenceAmount = newAmount - allowance.payload.amount;
  if (differenceAmount === 0n) throw new Error('User rejected update transaction');

  if (allowance.payload.type === AllowanceType.PERMIT2) {
    return preparePermit2Approve(
      allowance.payload.permit2Address,
      walletClient,
      allowance.contract,
      allowance.payload.spender,
      newAmount,
      allowance.payload.expiration,
    );
  }

  const baseRequest = {
    ...allowance.contract,
    account: allowance.owner,
    chain: walletClient.chain,
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

export const trackRevokeTransaction = (allowance: TokenAllowanceData, newAmount?: string) => {
  const isRevoke = !newAmount || newAmount === '0';
  const title = `${isRevoke ? 'Revoked' : 'Updated'} ${allowance.contract.tokenStandard} allowance`;

  analytics.track(title, {
    chainId: allowance.chainId,
    account: allowance.owner,
    spender: allowance.payload?.spender,
    token: allowance.contract.address,
    tokenId: allowance.payload?.type === AllowanceType.ERC721_SINGLE ? allowance.payload.tokenId : undefined,
    amount: isRevoke ? undefined : newAmount,
    permit2: allowance.payload?.type === AllowanceType.PERMIT2 ? true : undefined,
  });
};

const calculateMaxAllowanceAmount = (allowance: TokenAllowanceData) => {
  if (allowance.balance === 'ERC1155') {
    throw new Error('ERC1155 tokens are not supported');
  }

  if (isFungibleAllowance(allowance)) return allowance.payload.amount;
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
