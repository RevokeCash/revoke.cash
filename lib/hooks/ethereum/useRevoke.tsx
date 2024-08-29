'use client';

import { AllowanceData, OnUpdate, TransactionType } from 'lib/interfaces';
import { revokeAllowance, updateErc20Allowance } from 'lib/utils/allowances';
import { isErc721Contract } from 'lib/utils/tokens';
import { useWalletClient } from 'wagmi';
import { useHandleTransaction } from './useHandleTransaction';

export const useRevoke = (allowance: AllowanceData, onUpdate: OnUpdate) => {
  const { data: walletClient } = useWalletClient();
  const handleTransaction = useHandleTransaction(allowance.chainId);

  if (!allowance.spender) {
    return { revoke: undefined };
  }

  const revoke = async () => {
    const transactionPromise = revokeAllowance(walletClient, allowance, onUpdate);
    await handleTransaction(transactionPromise, TransactionType.REVOKE);
  };

  const update = async (newAmount: string) => {
    const transactionPromise = updateErc20Allowance(walletClient, allowance, newAmount, onUpdate);
    await handleTransaction(transactionPromise, TransactionType.UPDATE);
  };

  if (isErc721Contract(allowance.contract)) {
    return { revoke };
  }

  return { revoke, update };
};
