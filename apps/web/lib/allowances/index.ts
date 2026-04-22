import {
  AllowanceType,
  type OnUpdate,
  prepareRevokeErc721Allowance,
  prepareUpdateErc20Allowance,
  type TokenAllowanceData,
} from '@revoke.cash/core/allowances';
import blocksCache from '@revoke.cash/core/cache/blocks';
import { isTestnetChain } from '@revoke.cash/core/chains';
import { isErc721Contract } from '@revoke.cash/core/tokens';
import type { TransactionSubmitted } from '@revoke.cash/core/types';
import { parseFixedPointBigInt } from '@revoke.cash/core/utils/formatting';
import { waitForTransactionConfirmation, writeContractUnlessExcessiveGas } from '@revoke.cash/core/wallet';
import analytics from 'lib/utils/analytics';
import type { WalletClient } from 'viem';
import type { BatchType } from './batch-revoke';

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

    const lastUpdated = await blocksCache.getTimeLog(allowance.contract.publicClient, {
      ...transactionReceipt,
      blockNumber: Number(transactionReceipt.blockNumber),
    });

    onUpdate(allowance, { amount: newAmountParsed, lastUpdated });

    return transactionReceipt;
  };

  return { hash, confirmation: waitForConfirmation() };
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
