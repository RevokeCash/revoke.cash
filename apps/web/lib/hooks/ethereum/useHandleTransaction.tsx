import { type TransactionSubmitted, TransactionType } from '@revoke.cash/core/types';
import {
  isLedgerNanoSError,
  isMalformedWalletError,
  isNoFeeRequiredError,
  isRevertedError,
  isSwitchChainNotSupportedError,
  isUserRejectionError,
  parseErrorMessage,
} from '@revoke.cash/core/utils/errors';
import { displayTransactionSubmittedToast } from 'components/common/TransactionSubmittedToast';
import { useTranslations } from 'next-intl';
import { toast } from 'react-toastify';
import { stringify } from 'viem';

export const useHandleTransaction = (chainId: number) => {
  const t = useTranslations();

  const checkError = (e: any, type: TransactionType): void => {
    const parsedMessage = parseErrorMessage(e);
    console.debug(`Ran into transaction issue, message: \n${parsedMessage}`);

    // Don't show error toasts for user denied transactions
    if (isUserRejectionError(parsedMessage)) return;
    if (isNoFeeRequiredError(parsedMessage)) return;

    // Chain switch failures already get their own toast in useSwitchChain
    if (isSwitchChainNotSupportedError(e)) return;

    console.debug(stringify(e, null, 2));

    const message = isMalformedWalletError(parsedMessage) ? t('common.errors.unknown_wallet_error') : parsedMessage;

    // Not all ERC20 contracts allow for simple changes in approval to be made
    // https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
    // so we tell the user to revoke instead if the contract doesn't allow the simple use
    // of contract.approve(0)
    if (type === TransactionType.UPDATE) {
      return void toast.error(t('common.toasts.update_failed'));
    }

    if (type === TransactionType.REVOKE) {
      if (isLedgerNanoSError(message)) {
        return void toast.error(t('common.toasts.revoke_failed_ledger_nano_s'));
      }

      if (isRevertedError(message)) {
        return void toast.error(t('common.toasts.revoke_failed_revert', { message }));
      }

      return void toast.error(t('common.toasts.revoke_failed', { message }));
    }

    return void toast.error(t('common.toasts.transaction_failed', { message }));
  };

  const handleTransaction = async (transactionPromise: Promise<TransactionSubmitted>, type: TransactionType) => {
    try {
      const transaction = await transactionPromise;

      if (transaction.hash) {
        displayTransactionSubmittedToast(chainId, transaction.hash);
      }

      return transaction;
    } catch (e) {
      checkError(e, type);
      return undefined;
    }
  };

  return handleTransaction;
};
