import { ADDRESS_ZERO, MOONBIRDS_ADDRESS } from 'lib/constants';
import blocksDB from 'lib/databases/blocks';
import { useHandleTransaction } from 'lib/hooks/ethereum/useHandleTransaction';
import {
  TransactionType,
  type AllowanceData,
  type BaseAllowanceData,
  type BaseTokenData,
  type Erc20TokenContract,
  type Erc721TokenContract,
  type Log,
  type OnUpdate,
  type TokenContract,
  type TransactionSubmitted,
} from 'lib/interfaces';
import { TransactionStore } from 'lib/stores/transaction-store';
import { Address, PublicClient, toEventSelector, WalletClient, WriteContractParameters } from 'viem';
import { addressToTopic, deduplicateArray, waitForTransactionConfirmation, writeContractUnlessExcessiveGas } from '.';
import { track } from './analytics';
import { isNetworkError, isRevertedError, isUserRejectionError, parseErrorMessage, stringifyError } from './errors';
import {
  Erc20ApprovalEvent,
  Erc721ApprovalEvent,
  Erc721ApprovalForAllEvent,
  Erc721TransferEvent,
  TokenEvent,
  TokenEventType,
} from './events';
import { formatFixedPointBigInt, parseFixedPointBigInt } from './formatting';
import { getPermit2AllowancesFromApprovals, preparePermit2Approve } from './permit2';
import { createTokenContracts, getTokenData, hasZeroBalance, isErc721Contract } from './tokens';

export const getAllowancesFromEvents = async (
  owner: Address,
  events: TokenEvent[],
  publicClient: PublicClient,
  chainId: number,
): Promise<AllowanceData[]> => {
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
          return [tokenData as AllowanceData];
        }

        const fullAllowances = allowances.map((allowance) => ({ ...tokenData, ...allowance }));
        return fullAllowances;
      } catch (e) {
        if (isNetworkError(e)) throw e;
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
    .filter((allowance) => allowance.spender || allowance.balance !== 'ERC1155')
    .filter((allowance) => allowance.spender || !hasZeroBalance(allowance.balance, allowance.metadata.decimals))
    .sort((a, b) => a.metadata.symbol.localeCompare(b.metadata.symbol));
};

export const getAllowancesForToken = async (
  contract: TokenContract,
  events: TokenEvent[],
  userAddress: Address,
): Promise<BaseAllowanceData[]> => {
  if (isErc721Contract(contract)) {
    const unlimitedAllowances = await getUnlimitedErc721AllowancesFromApprovals(contract, userAddress, events);
    const limitedAllowances = await getLimitedErc721AllowancesFromApprovals(contract, events);

    const allowances = [...limitedAllowances, ...unlimitedAllowances].filter((allowance) => !!allowance);

    return allowances;
  } else {
    const regularAllowances = await getErc20AllowancesFromApprovals(contract, userAddress, events);
    const permit2Allowances = await getPermit2AllowancesFromApprovals(contract, userAddress, events);
    const allAllowances = [...regularAllowances, ...permit2Allowances];

    return allAllowances;
  }
};

export const getErc20AllowancesFromApprovals = async (
  contract: Erc20TokenContract,
  owner: Address,
  events: TokenEvent[],
) => {
  const approvalEvents = events.filter((event) => event.type === TokenEventType.APPROVAL_ERC20);
  const deduplicatedApprovalEvents = deduplicateArray(
    approvalEvents,
    (a, b) => a.token === b.token && a.owner === b.owner && a.payload.spender === b.payload.spender,
  );

  const allowances = await Promise.all(
    deduplicatedApprovalEvents.map((approval) => getErc20AllowanceFromApproval(contract, owner, approval)),
  );

  return allowances;
};

const getErc20AllowanceFromApproval = async (
  contract: Erc20TokenContract,
  owner: Address,
  approval: Erc20ApprovalEvent,
): Promise<BaseAllowanceData> => {
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

  return { spender, amount, lastUpdated };
};

export const getLimitedErc721AllowancesFromApprovals = async (contract: Erc721TokenContract, events: TokenEvent[]) => {
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

  return allowances;
};

const getLimitedErc721AllowanceFromApproval = async (
  contract: Erc721TokenContract,
  event: Erc721ApprovalEvent | Erc721TransferEvent,
) => {
  // "limited" NFT approvals are reset on transfer, so if the NFT was transferred more recently than it was approved,
  // we know for sure that the allowance is revoked
  if (event.type === TokenEventType.TRANSFER_ERC721) return undefined;

  const { tokenId, spender } = event.payload;

  // If the most recent approval was a REVOKE (aka APPROVE address(0)), we know for sure that the allowance is revoked
  if (spender === ADDRESS_ZERO) return undefined;

  const [lastUpdated] = await Promise.all([blocksDB.getTimeLog(contract.publicClient, event.time)]);

  return { spender, tokenId, lastUpdated };
};

export const getUnlimitedErc721AllowancesFromApprovals = async (
  contract: Erc721TokenContract,
  owner: string,
  events: TokenEvent[],
) => {
  const approvalForAllEvents = events.filter((event) => event.type === TokenEventType.APPROVAL_FOR_ALL);
  const deduplicatedApprovalForAllEvents = deduplicateArray(
    approvalForAllEvents,
    (a, b) => a.token === b.token && a.owner === b.owner && a.payload.spender === b.payload.spender,
  );

  const allowances = await Promise.all(
    deduplicatedApprovalForAllEvents.map((approval) =>
      getUnlimitedErc721AllowanceFromApproval(contract, owner, approval),
    ),
  );

  return allowances;
};

const getUnlimitedErc721AllowanceFromApproval = async (
  contract: Erc721TokenContract,
  _owner: string,
  approval: Erc721ApprovalForAllEvent,
) => {
  const { spender, approved: isApprovedForAll } = approval.payload;

  // If the most recent approval event was false, we know that the approval is revoked, and we don't need to check the chain
  if (!isApprovedForAll) return undefined;

  const [lastUpdated] = await Promise.all([blocksDB.getTimeLog(contract.publicClient, approval.time)]);

  return { spender, lastUpdated };
};

export const formatErc20Allowance = (allowance: bigint, decimals: number, totalSupply: bigint): string => {
  if (allowance > totalSupply) {
    return 'Unlimited';
  }

  return formatFixedPointBigInt(allowance, decimals);
};

export const getAllowanceI18nValues = (allowance: AllowanceData) => {
  if (!allowance.spender) {
    const i18nKey = 'address.allowances.none';
    return { i18nKey };
  }

  if (allowance.amount) {
    const amount = formatErc20Allowance(allowance.amount, allowance.metadata.decimals, allowance.metadata.totalSupply);
    const i18nKey = amount === 'Unlimited' ? 'address.allowances.unlimited' : 'address.allowances.amount';
    const { symbol } = allowance.metadata;
    return { amount, i18nKey, symbol };
  }

  const i18nKey = allowance.tokenId === undefined ? 'address.allowances.unlimited' : 'address.allowances.token_id';
  const { tokenId } = allowance;
  return { tokenId: tokenId?.toString(), i18nKey };
};

// This function is a hardcoded patch to show Moonbirds' OpenSea allowances,
// which do not show up normally because of a bug in their contract
export const generatePatchedAllowanceEvents = (
  userAddress: Address,
  openseaProxyAddress?: Address,
  allEvents: Log[] = [],
): Log[] => {
  if (!userAddress || !openseaProxyAddress) return [];

  // Only add the Moonbirds approval event if the account has interacted with Moonbirds at all
  if (!allEvents.some((ev) => ev.address === MOONBIRDS_ADDRESS)) return [];

  return [
    {
      // We use the deployment transaction hash as a placeholder for the approval transaction hash
      transactionHash: '0xd4547dc336dd4a0655f11267537964d7641f115ef3d5440d71514e3efba9d210',
      blockNumber: 14591056,
      transactionIndex: 145,
      logIndex: 0,
      address: MOONBIRDS_ADDRESS,
      topics: [
        toEventSelector('ApprovalForAll(address,address,bool)'),
        addressToTopic(userAddress),
        addressToTopic(openseaProxyAddress),
      ],
      data: '0x1',
      timestamp: 1649997510,
    },
  ];
};

export const stripAllowanceData = (allowance: AllowanceData): BaseTokenData => {
  const { contract, metadata, chainId, owner, balance } = allowance;
  return { contract, metadata, chainId, owner, balance };
};

export const getAllowanceKey = (allowance: AllowanceData) => {
  return `${allowance.contract.address}-${allowance.spender}-${allowance.tokenId}-${allowance.chainId}-${allowance.owner}`;
};

export const hasZeroAllowance = (allowance: BaseAllowanceData, tokenData: BaseTokenData) => {
  if (!allowance) return true;

  return (
    formatErc20Allowance(allowance.amount, tokenData?.metadata?.decimals, tokenData?.metadata?.totalSupply) === '0'
  );
};

export const revokeAllowance = async (
  walletClient: WalletClient,
  allowance: AllowanceData,
  onUpdate: OnUpdate,
): Promise<TransactionSubmitted | undefined> => {
  if (!allowance.spender) {
    return undefined;
  }

  if (isErc721Contract(allowance.contract)) {
    return revokeErc721Allowance(walletClient, allowance, onUpdate);
  }

  return revokeErc20Allowance(walletClient, allowance, onUpdate);
};

export const revokeErc721Allowance = async (
  walletClient: WalletClient,
  allowance: AllowanceData,
  onUpdate: OnUpdate,
): Promise<TransactionSubmitted> => {
  const transactionRequest = await prepareRevokeErc721Allowance(walletClient, allowance);
  const hash = await writeContractUnlessExcessiveGas(allowance.contract.publicClient, walletClient, transactionRequest);
  trackTransaction(allowance, hash);

  const waitForConfirmation = async () => {
    const transactionReceipt = await waitForTransactionConfirmation(hash, allowance.contract.publicClient);
    onUpdate(allowance, undefined);
    return transactionReceipt;
  };

  return { hash, confirmation: waitForConfirmation() };
};

export const revokeErc20Allowance = async (
  walletClient: WalletClient,
  allowance: AllowanceData,
  onUpdate: OnUpdate,
): Promise<TransactionSubmitted | undefined> => {
  return updateErc20Allowance(walletClient, allowance, '0', onUpdate);
};

export const updateErc20Allowance = async (
  walletClient: WalletClient,
  allowance: AllowanceData,
  newAmount: string,
  onUpdate: OnUpdate,
): Promise<TransactionSubmitted | undefined> => {
  const newAmountParsed = parseFixedPointBigInt(newAmount, allowance.metadata.decimals);
  const transactionRequest = await prepareUpdateErc20Allowance(walletClient, allowance, newAmountParsed);
  if (!transactionRequest) return;

  const hash = await writeContractUnlessExcessiveGas(allowance.contract.publicClient, walletClient, transactionRequest);
  trackTransaction(allowance, hash, newAmount, allowance.expiration);

  const waitForConfirmation = async () => {
    const transactionReceipt = await waitForTransactionConfirmation(hash, allowance.contract.publicClient);
    const lastUpdated = await blocksDB.getTimeLog(allowance.contract.publicClient, {
      ...transactionReceipt,
      blockNumber: Number(transactionReceipt.blockNumber),
    });

    onUpdate(allowance, { amount: newAmountParsed, lastUpdated });

    return transactionReceipt;
  };

  return { hash, confirmation: waitForConfirmation() };
};

export const prepareRevokeAllowance = async (walletClient: WalletClient, allowance: AllowanceData) => {
  if (!allowance.spender) {
    return undefined;
  }

  if (isErc721Contract(allowance.contract)) {
    return prepareRevokeErc721Allowance(walletClient, allowance);
  }

  return prepareRevokeErc20Allowance(walletClient, allowance);
};

export const prepareRevokeErc721Allowance = async (
  walletClient: WalletClient,
  allowance: AllowanceData,
): Promise<WriteContractParameters> => {
  if (allowance.tokenId !== undefined) {
    const transactionRequest = {
      ...(allowance.contract as Erc721TokenContract),
      functionName: 'approve' as const,
      args: [ADDRESS_ZERO, allowance.tokenId] as const,
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
    args: [allowance.spender, false] as const,
    account: allowance.owner,
    chain: walletClient.chain,
    value: 0n as any as never, // Workaround for Gnosis Safe, TODO: remove when fixed
  };

  const gas = await allowance.contract.publicClient.estimateContractGas(transactionRequest);
  return { ...transactionRequest, gas };
};

export const prepareRevokeErc20Allowance = async (
  walletClient: WalletClient,
  allowance: AllowanceData,
): Promise<WriteContractParameters | undefined> => {
  return prepareUpdateErc20Allowance(walletClient, allowance, 0n);
};

export const prepareUpdateErc20Allowance = async (
  walletClient: WalletClient,
  allowance: AllowanceData,
  newAmount: bigint,
): Promise<WriteContractParameters | undefined> => {
  if (isErc721Contract(allowance.contract)) {
    throw new Error('Cannot update ERC721 allowances');
  }

  const differenceAmount = newAmount - allowance.amount;
  if (differenceAmount === 0n) return;

  if (allowance.expiration !== undefined) {
    return preparePermit2Approve(
      allowance.permit2Address,
      walletClient,
      allowance.contract,
      allowance.spender,
      newAmount,
      allowance.expiration,
    );
  }

  const baseRequest = {
    ...allowance.contract,
    account: allowance.owner,
    chain: walletClient.chain,
    value: 0n as any as never, // Workaround for Gnosis Safe, TODO: remove when fixed
  };

  try {
    console.debug(`Calling contract.approve(${allowance.spender}, ${newAmount})`);

    const transactionRequest = {
      ...baseRequest,
      functionName: 'approve' as const,
      args: [allowance.spender, newAmount] as const,
    };

    const gas = await allowance.contract.publicClient.estimateContractGas(transactionRequest);
    return { ...transactionRequest, gas };
  } catch (e) {
    if (!isRevertedError(parseErrorMessage(e))) throw e;

    // Some tokens can only change approval with {increase|decrease}Approval
    if (differenceAmount > 0n) {
      console.debug(`Calling contract.increaseAllowance(${allowance.spender}, ${differenceAmount})`);

      const transactionRequest = {
        ...baseRequest,
        functionName: 'increaseAllowance' as const,
        args: [allowance.spender, differenceAmount] as const,
      };

      const gas = await allowance.contract.publicClient.estimateContractGas(transactionRequest);
      return { ...transactionRequest, gas };
    } else {
      console.debug(`Calling contract.decreaseAllowance(${allowance.spender}, ${-differenceAmount})`);

      const transactionRequest = {
        ...baseRequest,
        functionName: 'decreaseAllowance' as const,
        args: [allowance.spender, -differenceAmount] as const,
      };

      const gas = await allowance.contract.publicClient.estimateContractGas(transactionRequest);
      return { ...transactionRequest, gas };
    }
  }
};

const trackTransaction = (allowance: AllowanceData, hash: string, newAmount?: string, expiration?: number) => {
  if (!hash) return;

  if (isErc721Contract(allowance.contract)) {
    track('Revoked ERC721 allowance', {
      chainId: allowance.chainId,
      account: allowance.owner,
      spender: allowance.spender,
      token: allowance.contract.address,
      tokenId: allowance.tokenId,
    });
  }

  track(newAmount === '0' ? 'Revoked ERC20 allowance' : 'Updated ERC20 allowance', {
    chainId: allowance.chainId,
    account: allowance.owner,
    spender: allowance.spender,
    token: allowance.contract.address,
    amount: newAmount === '0' ? undefined : newAmount,
    permit2: expiration !== undefined,
  });
};

// Wraps the revoke function to update the transaction store and do any error handling
// TODO: Add other kinds of transactions besides "revoke" transactions to the store
export const wrapRevoke = (
  allowance: AllowanceData,
  revoke: () => Promise<TransactionSubmitted | undefined>,
  updateTransaction: TransactionStore['updateTransaction'],
  handleTransaction?: ReturnType<typeof useHandleTransaction>,
) => {
  return async () => {
    try {
      updateTransaction(allowance, { status: 'pending' });
      const transactionPromise = revoke();

      if (handleTransaction) await handleTransaction(transactionPromise, TransactionType.REVOKE);
      const transactionSubmitted = await transactionPromise;

      updateTransaction(allowance, { status: 'pending', transactionHash: transactionSubmitted?.hash });

      // We don't await this, since we want to return after submitting all transactions, even if they're still pending
      transactionSubmitted.confirmation.then(() => {
        updateTransaction(allowance, { status: 'confirmed', transactionHash: transactionSubmitted.hash });
      });

      return transactionSubmitted;
    } catch (error) {
      const message = parseErrorMessage(error);
      if (isUserRejectionError(message)) {
        updateTransaction(allowance, { status: 'not_started' });
      } else {
        updateTransaction(allowance, { status: 'reverted', error: message });
      }
    }
  };
};
