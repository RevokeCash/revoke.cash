'use client';

import { TransactionType } from 'lib/interfaces';
import {
  type OnUpdate,
  type TokenAllowanceData,
  getAllowanceKey,
  revokeAllowance,
  trackRevokeTransaction,
  updateAllowance,
} from 'lib/utils/allowances';
import { useWalletClient } from 'wagmi';
import { useTransactionStore, wrapTransaction } from '../../stores/transaction-store';
import { useHandleTransaction } from './useHandleTransaction';

// TODO: Add other kinds of transactions besides "revoke" transactions to the store

export const useRevoke = (allowance: TokenAllowanceData, onUpdate: OnUpdate) => {
  const { updateTransaction } = useTransactionStore();

  const { data: walletClient } = useWalletClient();
  const handleTransaction = useHandleTransaction(allowance.chainId);

  if (!allowance.payload) {
    return { revoke: undefined };
  }

  const revoke = wrapTransaction({
    transactionKey: getAllowanceKey(allowance),
    transactionType: TransactionType.REVOKE,
    executeTransaction: () => revokeAllowance(walletClient!, allowance, onUpdate),
    trackTransaction: () => trackRevokeTransaction(allowance),
    updateTransaction,
    handleTransaction,
  });

  const update = (newAmount: string) => {
    const wrappedUpdate = wrapTransaction({
      transactionKey: `update-${getAllowanceKey(allowance)}`,
      transactionType: TransactionType.UPDATE,
      executeTransaction: () => updateAllowance(walletClient!, allowance, newAmount, onUpdate),
      trackTransaction: () => trackRevokeTransaction(allowance, newAmount),
      updateTransaction,
      handleTransaction,
    });

    return wrappedUpdate();
  };

  if (allowance.contract.tokenStandard === 'ERC721') {
    return { revoke };
  }

  return { revoke, update };
};
