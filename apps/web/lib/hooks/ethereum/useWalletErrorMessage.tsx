import { isMalformedWalletError, isWalletLockedError, parseErrorMessage } from '@revoke.cash/core/utils/errors';
import { useTranslations } from 'next-intl';

// Replaces raw wallet errors that users cannot act on with a readable message
export const useWalletErrorMessage = () => {
  const t = useTranslations();

  const getWalletErrorMessage = (error: unknown): string => {
    const message = parseErrorMessage(error);
    if (isMalformedWalletError(message)) return t('common.errors.unknown_wallet_error');
    if (isWalletLockedError(message)) return t('common.errors.wallet_locked');
    return message;
  };

  return getWalletErrorMessage;
};
