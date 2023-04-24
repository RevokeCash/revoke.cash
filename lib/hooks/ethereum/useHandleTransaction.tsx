import type { TransactionResponse } from '@ethersproject/abstract-provider';
import { displayTransactionSubmittedToast } from 'components/common/transaction-submitted-toast';
import { TransactionType } from 'lib/interfaces';
import { isRevertedError, isUserRejectionError } from 'lib/utils/errors';
import useTranslation from 'next-translate/useTranslation';
import { useRef } from 'react';
import { toast } from 'react-toastify';

export const useHandleTransaction = () => {
  const toastRef = useRef();
  const { t } = useTranslation();

  const checkError = (e: any, type: TransactionType): void => {
    const code = e.error?.code ?? e.code;
    const message = e.error?.reason ?? e.reason ?? e.error?.message ?? e.message;
    console.debug(`Ran into transaction issue, message: ${message} (${code})`);
    console.debug(JSON.stringify(e));

    // Don't show error toasts for user denied transactions
    if (isUserRejectionError(e)) return;

    // Not all ERC20 contracts allow for simple changes in approval to be made
    // https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
    // so we tell the user to revoke instead if the contract doesn't allow the simple use
    // of contract.approve(0)
    if (type === TransactionType.UPDATE) {
      return void toast.info(t('common:toasts.update_failed'));
    }

    if (type === TransactionType.REVOKE) {
      if (isRevertedError(e)) {
        return void toast.info(t('common:toasts.revoke_failed_revert', { message }));
      }

      return void toast.info(t('common:toasts.revoke_failed', { message }));
    }

    return void toast.info(t('common:toasts.transaction_failed', { message }));
  };

  const handleTransaction = async (transactionPromise: Promise<TransactionResponse>, type: TransactionType) => {
    try {
      const transaction = await transactionPromise;

      if (transaction) {
        displayTransactionSubmittedToast(toastRef, t);
      }

      return transaction;
    } catch (e) {
      checkError(e, type);
      return undefined;
    }
  };

  return handleTransaction;
};
