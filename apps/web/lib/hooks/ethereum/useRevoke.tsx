'use client';

import { TransactionType } from 'lib/interfaces';
import {
  getAllowanceKey,
  type OnUpdate,
  revokeAllowance,
  type TokenAllowanceData,
  trackRevokeTransaction,
  updateErc20Allowance,
} from 'lib/utils/allowances';
import { isErc721Contract } from 'lib/utils/tokens';
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
  const handleTransaction = useHandleTransaction(allowance.chainId);

  if (!allowance.payload) {
    return { revoke: undefined };
  }

  const revoke = wrapTransaction({
    transactionKey: revokeTransactionKey,
    transactionType: TransactionType.REVOKE,
    executeTransaction: async () => {
      const walletClient = await ensureWalletClient(allowance.chainId);
      return revokeAllowance(walletClient, allowance, onUpdate);
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
        return updateErc20Allowance(walletClient, allowance, newAmount, onUpdate);
      },
      trackTransaction: () => trackRevokeTransaction(allowance, undefined, newAmount),
      updateTransaction,
      handleTransaction,
    });

    return wrappedUpdate();
  };

  if (isErc721Contract(allowance.contract)) {
    return { revoke };
  }

  return { revoke, update, isRevoking, isUpdating };
};
