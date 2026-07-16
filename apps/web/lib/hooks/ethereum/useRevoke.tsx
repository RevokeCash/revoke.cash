'use client';

import { getAllowanceKey, type OnUpdate, type TokenAllowanceData } from '@revoke.cash/core/allowances';
import { isErc721 } from '@revoke.cash/core/tokens';
import { TransactionType } from '@revoke.cash/core/types';
import { revokeAllowance, trackRevokeTransaction, updateErc20Allowance } from 'lib/allowances';
import { usePublicClient } from 'wagmi';
import { isTransactionStatusLoadingState, useTransactionStore, wrapTransaction } from '../../stores/transaction-store';
import { useEnsureWalletClient } from './ensureWalletClient';
import { useHandleTransaction } from './useHandleTransaction';

// TODO: Add other kinds of transactions besides "revoke" transactions to the store

export const useRevoke = (allowance: TokenAllowanceData, onUpdate: OnUpdate) => {
  const revokeTransactionKey = getAllowanceKey(allowance);
  const updateTransactionKey = `update-${revokeTransactionKey}`;

  const { updateTransaction } = useTransactionStore();

  const revokeResult = useTransactionStore((state) => state.results[revokeTransactionKey]);
  const updateResult = useTransactionStore((state) => state.results[updateTransactionKey]);

  const isRevoking = isTransactionStatusLoadingState(revokeResult?.status);
  const isUpdating = isTransactionStatusLoadingState(updateResult?.status);

  const { ensureWalletClient } = useEnsureWalletClient();
  const publicClient = usePublicClient({ chainId: allowance.chainId })!;
  const handleTransaction = useHandleTransaction(allowance.chainId);

  const revoke = wrapTransaction({
    transactionKey: revokeTransactionKey,
    transactionType: TransactionType.REVOKE,
    executeTransaction: async () => {
      const walletClient = await ensureWalletClient(allowance.chainId);
      return revokeAllowance(walletClient, allowance, publicClient, onUpdate);
    },
    trackTransaction: () => trackRevokeTransaction(allowance),
    updateTransaction,
    handleTransaction,
  });

  const update = (newAmount: string) => {
    const wrappedUpdate = wrapTransaction({
      transactionKey: updateTransactionKey,
      transactionType: TransactionType.UPDATE,
      executeTransaction: async () => {
        const walletClient = await ensureWalletClient(allowance.chainId);
        return updateErc20Allowance(walletClient, allowance, publicClient, newAmount, onUpdate);
      },
      trackTransaction: () => trackRevokeTransaction(allowance, undefined, newAmount),
      updateTransaction,
      handleTransaction,
    });

    return wrappedUpdate();
  };

  if (isErc721(allowance.token)) {
    return { revoke };
  }

  return { revoke, update, isRevoking, isUpdating };
};
