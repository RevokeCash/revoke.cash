import {
  AllowanceType,
  type OnUpdate,
  prepareRevokeErc721Allowance,
  prepareUpdateErc20Allowance,
  type TokenAllowanceData,
} from '@revoke.cash/core/allowances';
import blocksCache from '@revoke.cash/core/cache/blocks';
import { isTestnetChain } from '@revoke.cash/core/chains';
import { isErc721 } from '@revoke.cash/core/tokens';
import type { TransactionSubmitted } from '@revoke.cash/core/types';
import { parseFixedPointBigInt } from '@revoke.cash/core/utils/formatting';
import { waitForTransactionConfirmation, writeContractUnlessExcessiveGas } from '@revoke.cash/core/wallet';
import analytics from 'lib/utils/analytics';
import type { PublicClient, WalletClient } from 'viem';
import type { BatchType } from './batch-revoke';

export const revokeAllowance = async (
  walletClient: WalletClient,
  allowance: TokenAllowanceData,
  publicClient: PublicClient,
  onUpdate: OnUpdate,
): Promise<TransactionSubmitted> => {
  if (isErc721(allowance.token)) {
    return revokeErc721Allowance(walletClient, allowance, publicClient, onUpdate);
  }

  return revokeErc20Allowance(walletClient, allowance, publicClient, onUpdate);
};

export const revokeErc721Allowance = async (
  walletClient: WalletClient,
  allowance: TokenAllowanceData,
  publicClient: PublicClient,
  onUpdate: OnUpdate,
): Promise<TransactionSubmitted> => {
  const transactionRequest = await prepareRevokeErc721Allowance(allowance, publicClient);
  const hash = await writeContractUnlessExcessiveGas(publicClient, walletClient, transactionRequest);

  const waitForConfirmation = async () => {
    const transactionReceipt = await waitForTransactionConfirmation(hash, publicClient);
    onUpdate(allowance, undefined);
    return transactionReceipt;
  };

  return { hash, confirmation: waitForConfirmation() };
};

export const revokeErc20Allowance = async (
  walletClient: WalletClient,
  allowance: TokenAllowanceData,
  publicClient: PublicClient,
  onUpdate: OnUpdate,
): Promise<TransactionSubmitted> => {
  return updateErc20Allowance(walletClient, allowance, publicClient, '0', onUpdate);
};

export const updateErc20Allowance = async (
  walletClient: WalletClient,
  allowance: TokenAllowanceData,
  publicClient: PublicClient,
  newAmount: string,
  onUpdate: OnUpdate,
): Promise<TransactionSubmitted> => {
  const newAmountParsed = parseFixedPointBigInt(newAmount, allowance.metadata.decimals);
  const transactionRequest = await prepareUpdateErc20Allowance(allowance, newAmountParsed, publicClient);

  const hash = await writeContractUnlessExcessiveGas(publicClient, walletClient, transactionRequest);

  const waitForConfirmation = async () => {
    const transactionReceipt = await waitForTransactionConfirmation(hash, publicClient);
    if (!transactionReceipt) return;

    const lastUpdated = await blocksCache.getTimeLog(publicClient, {
      ...transactionReceipt,
      blockNumber: Number(transactionReceipt.blockNumber),
    });

    onUpdate(allowance, { amount: newAmountParsed, lastUpdated });

    return transactionReceipt;
  };

  return { hash, confirmation: waitForConfirmation() };
};

export const trackRevokeTransaction = (allowance: TokenAllowanceData, batchType?: BatchType, newAmount?: string) => {
  if (isErc721(allowance.token)) {
    analytics.track('Revoked ERC721 allowance', {
      chainId: allowance.chainId,
      account: allowance.owner,
      spender: allowance.payload.spender,
      tokenAddress: allowance.token.address,
      tokenId: allowance.payload.type === AllowanceType.ERC721_SINGLE ? allowance.payload.tokenId : undefined,
      isTestnet: isTestnetChain(allowance.chainId),
      batchType,
    });
    return;
  }

  const isRevoke = !newAmount || newAmount === '0';

  analytics.track(isRevoke ? 'Revoked ERC20 allowance' : 'Updated ERC20 allowance', {
    chainId: allowance.chainId,
    account: allowance.owner,
    spender: allowance.payload.spender,
    tokenAddress: allowance.token.address,
    amount: isRevoke ? undefined : newAmount,
    permit2: allowance.payload.type === AllowanceType.PERMIT2,
    isTestnet: isTestnetChain(allowance.chainId),
    batchType,
  });
};
