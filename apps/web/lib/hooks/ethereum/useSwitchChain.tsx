import { getChainAddEthereumChainParameter, getChainName } from '@revoke.cash/core/chains';
import {
  isRequestAlreadyPendingError,
  isUserRejectionError,
  SwitchChainHandledError,
} from '@revoke.cash/core/utils/errors';
import { useTranslations } from 'next-intl';
import { useCallback } from 'react';
import { toast } from 'react-toastify';
import { UserRejectedRequestError } from 'viem';
import { useConnection, useSwitchChain as useSwitchChainInternal } from 'wagmi';

export const useSwitchChain = () => {
  const t = useTranslations();

  const { mutateAsync: switchChainAsyncInternal } = useSwitchChainInternal();
  const { connector } = useConnection();
  const canSwitchChain = connector?.type === 'injected';

  const switchChainAsync = useCallback(
    async (chainId: number) => {
      try {
        const addEthereumChainParameter = getChainAddEthereumChainParameter(chainId);
        return await switchChainAsyncInternal({ chainId, addEthereumChainParameter });
      } catch (error) {
        console.error(error);
        // Rejecting the switch prompt is intentional, and a duplicate request means the first switch
        // prompt is still open in the wallet, so we only show an error toast for other failures
        if (!isRejectedByUser(error) && !isRequestAlreadyPendingError(error)) {
          toast.error(t('common.toasts.switch_chain_failed', { chainName: getChainName(chainId) }));
        }
        throw new SwitchChainHandledError(error);
      }
    },
    [switchChainAsyncInternal, t],
  );

  const switchChain = useCallback(
    (chainId: number) => {
      switchChainAsync(chainId).catch(() => {});
    },
    [switchChainAsync],
  );

  return { switchChain, switchChainAsync, canSwitchChain };
};

// Connectors wrap every chain switch / add failure in UserRejectedRequestError, even when the wallet was never
// prompted (e.g. WalletConnect wallets that do not support the chain). So when we see a UserRejectedRequestError
// wrapper, we look for an actual rejection in the underlying causes instead of trusting the wrapper.
const isRejectedByUser = (error: unknown): boolean => {
  if (!(error instanceof UserRejectedRequestError)) return isUserRejectionError(error);

  const rejectionCause = error.walk((cause) => {
    if (cause === error) return false;
    const { code, message } = cause as { code?: number; message?: string };
    return code === UserRejectedRequestError.code || isUserRejectionError(message);
  });

  return Boolean(rejectionCause);
};
