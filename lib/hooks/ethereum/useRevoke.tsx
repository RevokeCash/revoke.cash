'use client';

import { AllowanceData, OnUpdate, TransactionType } from 'lib/interfaces';
import { revokeAllowance, updateErc20Allowance, wrapRevoke } from 'lib/utils/allowances';
import { isErc721Contract } from 'lib/utils/tokens';
import { useWalletClient } from 'wagmi';
import { useTransactionStore } from '../../stores/transaction-store';
import { useHandleTransaction } from './useHandleTransaction';

// TODO: Add other kinds of transactions besides "revoke" transactions to the store

export const useRevoke = (allowance: AllowanceData, onUpdate: OnUpdate) => {
  const { updateTransaction } = useTransactionStore();

  const { data: walletClient } = useWalletClient();
  const handleTransaction = useHandleTransaction(allowance.chainId);

  if (!allowance.spender) {
    return { revoke: undefined };
  }

  const revoke = wrapRevoke(
    allowance,
    () => revokeAllowance(walletClient, allowance, onUpdate),
    updateTransaction,
    handleTransaction,
  );

  const update = async (newAmount: string) => {
    const transactionPromise = updateErc20Allowance(walletClient, allowance, newAmount, onUpdate);
    return handleTransaction(transactionPromise, TransactionType.UPDATE);
  };

  if (isErc721Contract(allowance.contract)) {
    return { revoke };
  }

  return { revoke, update };
};
