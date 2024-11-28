import { displayTransactionSubmittedToast } from 'components/common/TransactionSubmittedToast';
import { type TransactionSubmitted, TransactionType } from 'lib/interfaces';
import { isRevertedError, isUserRejectionError, parseErrorMessage } from 'lib/utils/errors';
import { useTranslations } from 'next-intl';
import { toast } from 'react-toastify';
import { stringify } from 'viem';

export const useHandleTransaction = (chainId: number) => {
  const t = useTranslations();

  const checkError = (e: any, type: TransactionType): void => {
    const message = parseErrorMessage(e);
    console.debug(`Ran into transaction issue, message: \n${message}`);

    // Don't show error toasts for user denied transactions
    if (isUserRejectionError(message)) return;

    console.debug(stringify(e, null, 2));

    // Not all ERC20 contracts allow for simple changes in approval to be made
    // https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
    // so we tell the user to revoke instead if the contract doesn't allow the simple use
    // of contract.approve(0)
    if (type === TransactionType.UPDATE) {
      return void toast.info(t('common.toasts.update_failed'));
    }

    if (type === TransactionType.REVOKE) {
      if (isRevertedError(message)) {
        return void toast.info(t('common.toasts.revoke_failed_revert'));
      }

      return void toast.info(t('common.toasts.revoke_failed', { message }));
    }

    return void toast.info(t('common.toasts.transaction_failed', { message }));
  };

  const handleTransaction = async (
    transactionPromise: Promise<TransactionSubmitted | undefined>,
    type: TransactionType,
  ) => {
    try {
      const transaction = await transactionPromise;

      if (transaction?.hash) {
        if (type === TransactionType.DONATE) {
          toast.info(t('common.toasts.donation_sent'));
        } else {
          displayTransactionSubmittedToast(chainId, transaction.hash);
        }
      }

      return transaction;
    } catch (e) {
      checkError(e, type);
      return undefined;
    }
  };

  return handleTransaction;
};
