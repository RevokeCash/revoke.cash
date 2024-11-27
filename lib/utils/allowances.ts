import { ADDRESS_ZERO, MOONBIRDS_ADDRESS } from 'lib/constants';
import blocksDB from 'lib/databases/blocks';
import type { useHandleTransaction } from 'lib/hooks/ethereum/useHandleTransaction';
import {
  TransactionType,
  type AddressEvents,
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
import type { TransactionStore } from 'lib/stores/transaction-store';
import { type Address, type PublicClient, type WalletClient, type WriteContractParameters, fromHex, getEventSelector } from 'viem';
import {
  addressToTopic,
  deduplicateLogsByTopics,
  filterLogsByAddress,
  filterLogsByTopics,
  sortLogsChronologically,
  topicToAddress,
  waitForTransactionConfirmation,
  writeContractUnlessExcessiveGas,
} from '.';
import { track } from './analytics';
import { isNetworkError, isRevertedError, isUserRejectionError, parseErrorMessage, stringifyError } from './errors';
import { formatFixedPointBigInt, parseFixedPointBigInt } from './formatting';
import { getPermit2AllowancesFromApprovals, preparePermit2Approve } from './permit2';
import { createTokenContracts, getTokenData, hasZeroBalance, isErc721Contract } from './tokens';

export const getAllowancesFromEvents = async (
  owner: Address,
  events: AddressEvents,
  publicClient: PublicClient,
  chainId: number,
): Promise<AllowanceData[]> => {
  // We put ApprovalForAll first to ensure that incorrect ERC721 contracts like CryptoStrikers are handled correctly
  const allEvents = [...events.approvalForAll, ...events.approval, ...events.transferTo];
  const contracts = createTokenContracts(allEvents, publicClient);

  // Look up token data for all tokens, add their lists of approvals
  const allowances = await Promise.all(
    contracts.map(async (contract) => {
      const approvalsForAll = filterLogsByAddress(events.approvalForAll, contract.address);
      const approvals = filterLogsByAddress(events.approval, contract.address);
      const transfersFrom = filterLogsByAddress(events.transferFrom, contract.address);
      const transfersTo = filterLogsByAddress(events.transferTo, contract.address);
      const permit2TopicFilter = [null, null, addressToTopic(contract.address)];
      const permit2Approval = filterLogsByTopics(events.permit2Approval, permit2TopicFilter);

      try {
        const tokenData = await getTokenData(contract, owner, transfersFrom, transfersTo, chainId);
        const allowances = await getAllowancesForToken(
          contract,
          approvals,
          approvalsForAll,
          permit2Approval,
          owner,
          tokenData,
        );

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
  approvalEvents: Log[],
  approvalForAllEvents: Log[],
  permit2ApprovalEvents: Log[],
  userAddress: Address,
  tokenData: BaseTokenData,
): Promise<BaseAllowanceData[]> => {
  if (isErc721Contract(contract)) {
    const unlimitedAllowances = await getUnlimitedErc721AllowancesFromApprovals(
      contract,
      userAddress,
      approvalForAllEvents,
    );
    const limitedAllowances = await getLimitedErc721AllowancesFromApprovals(contract, approvalEvents);

    const allowances = [...limitedAllowances, ...unlimitedAllowances].filter((allowance) => !!allowance);

    return allowances;
  } else {
    const regularAllowances = await getErc20AllowancesFromApprovals(contract, userAddress, approvalEvents);
    const permit2Allowances = await getPermit2AllowancesFromApprovals(contract, userAddress, permit2ApprovalEvents);
    const allAllowances = [...regularAllowances, ...permit2Allowances];

    // Filter out zero-value allowances
    const filteredAllowance = allAllowances.filter((allowance) => !hasZeroAllowance(allowance, tokenData));

    return filteredAllowance;
  }
};

export const getErc20AllowancesFromApprovals = async (
  contract: Erc20TokenContract,
  owner: Address,
  approvals: Log[],
) => {
  const sortedApprovals = sortLogsChronologically(approvals).reverse();
  const deduplicatedApprovals = deduplicateLogsByTopics(sortedApprovals);

  const allowances = await Promise.all(
    deduplicatedApprovals.map((approval) => getErc20AllowanceFromApproval(contract, owner, approval)),
  );

  return allowances;
};

const getErc20AllowanceFromApproval = async (
  contract: Erc20TokenContract,
  owner: Address,
  approval: Log,
): Promise<BaseAllowanceData> => {
  const spender = topicToAddress(approval.topics[2]);
  const lastApprovedAmount = fromHex(approval.data, 'bigint');

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
    blocksDB.getTimeLog(contract.publicClient, approval),
  ]);

  return { spender, amount, lastUpdated };
};

export const getLimitedErc721AllowancesFromApprovals = async (contract: Erc721TokenContract, approvals: Log[]) => {
  const sortedApprovals = sortLogsChronologically(approvals).reverse();

  // We only look at the topic0 (event signature) and topic3 (token ID), since a token ID can only have one *limited* approval at a time
  const deduplicatedApprovals = deduplicateLogsByTopics(sortedApprovals, [0, 3]);

  const allowances = await Promise.all(
    deduplicatedApprovals.map((approval) => getLimitedErc721AllowanceFromApproval(contract, approval)),
  );

  return allowances;
};

const getLimitedErc721AllowanceFromApproval = async (contract: Erc721TokenContract, approval: Log) => {
  // Wrap this in a try-catch since it's possible the NFT has been burned
  try {
    // Some contracts (like CryptoStrikers) may not implement ERC721 correctly
    // by making tokenId a non-indexed parameter, in which case it needs to be
    // taken from the event data rather than topics
    const tokenIdEncoded = approval.topics.length === 4 ? approval.topics[3] : approval.data;
    const tokenId = fromHex(tokenIdEncoded, 'bigint');
    const lastApproved = topicToAddress(approval.topics[2]);

    // If the most recent approval was a REVOKE, we know for sure that the allowance is revoked
    // If not, we need to check the current allowance because we cannot determine the allowance from the event
    // since it may have been "revoked" by transferring the NFT to another address
    // TODO: We can probably join Approve and Transfer events to get the actual approved status from just events
    if (lastApproved === ADDRESS_ZERO) return undefined;

    const [owner, spender, lastUpdated] = await Promise.all([
      contract.publicClient.readContract({ ...contract, functionName: 'ownerOf', args: [tokenId] }),
      contract.publicClient.readContract({
        ...contract,
        functionName: 'getApproved',
        args: [tokenId],
      }),
      blocksDB.getTimeLog(contract.publicClient, approval),
    ]);

    const expectedOwner = topicToAddress(approval.topics[1]);
    if (spender === ADDRESS_ZERO || owner !== expectedOwner) return undefined;

    return { spender, tokenId, lastUpdated };
  } catch {
    return undefined;
  }
};

export const getUnlimitedErc721AllowancesFromApprovals = async (
  contract: Erc721TokenContract,
  owner: string,
  approvals: Log[],
) => {
  const sortedApprovals = sortLogsChronologically(approvals).reverse();
  const deduplicatedApprovals = deduplicateLogsByTopics(sortedApprovals);

  const allowances = await Promise.all(
    deduplicatedApprovals.map((approval) => getUnlimitedErc721AllowanceFromApproval(contract, owner, approval)),
  );

  return allowances;
};

const getUnlimitedErc721AllowanceFromApproval = async (
  contract: Erc721TokenContract,
  _owner: string,
  approval: Log,
) => {
  const spender = topicToAddress(approval.topics[2]);

  // For ApprovalForAll events, we can determine the allowance (true/false) from *only* the event
  // so we do not have to check the chain for the current allowance
  const isApprovedForAll = approval.data !== '0x' && fromHex(approval.data, 'bigint') !== 0n;

  // If the allowance already revoked, we don't need to make any more requests
  if (!isApprovedForAll) return undefined;

  const [lastUpdated] = await Promise.all([blocksDB.getTimeLog(contract.publicClient, approval)]);

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
        getEventSelector('ApprovalForAll(address,address,bool)'),
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
