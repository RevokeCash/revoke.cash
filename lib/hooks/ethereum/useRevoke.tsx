'use client';

import { TransactionType } from 'lib/interfaces';
import {
  type OnUpdate,
  type TokenAllowanceData,
  revokeAllowance,
  updateErc20Allowance,
  wrapRevoke,
} from 'lib/utils/allowances';
import { isErc721Contract } from 'lib/utils/tokens';
import { useWalletClient } from 'wagmi';
import { useTransactionStore } from '../../stores/transaction-store';
import { useHandleTransaction } from './useHandleTransaction';

// TODO: Add other kinds of transactions besides "revoke" transactions to the store

export const useRevoke = (allowance: TokenAllowanceData, onUpdate: OnUpdate) => {
  const { updateTransaction } = useTransactionStore();

  const { data: walletClient } = useWalletClient();
  const handleTransaction = useHandleTransaction(allowance.chainId);

  if (!allowance.payload) {
    return { revoke: undefined };
  }

  const revoke = wrapRevoke(
    allowance,
    () => revokeAllowance(walletClient!, allowance, onUpdate),
    updateTransaction,
    handleTransaction,
  );

  const update = async (newAmount: string) => {
    const transactionPromise = updateErc20Allowance(walletClient!, allowance, newAmount, onUpdate);
    return handleTransaction(transactionPromise, TransactionType.UPDATE);
  };

  if (isErc721Contract(allowance.contract)) {
    return { revoke };
  }

  return { revoke, update };
};
