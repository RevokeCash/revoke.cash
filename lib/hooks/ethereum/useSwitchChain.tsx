import { getChainAddEthereumChainParameter } from 'lib/utils/chains';
import { useTranslations } from 'next-intl';
import { useCallback } from 'react';
import { toast } from 'react-toastify';
import { useAccount, useSwitchChain as useSwitchChainInternal } from 'wagmi';

export const useSwitchChain = () => {
  const t = useTranslations();

  const { switchChain: switchChainInternal, switchChainAsync: switchChainAsyncInternal } = useSwitchChainInternal();
  const { connector } = useAccount();
  const canSwitchChain = connector?.type === 'injected';

  const switchChain = useCallback(
    (chainId: number) => {
      try {
        const addEthereumChainParameter = getChainAddEthereumChainParameter(chainId);
        return switchChainInternal({ chainId, addEthereumChainParameter });
      } catch (error) {
        console.error(error);
        toast.error(t('common.toasts.switch_chain_failed'));
        throw error;
      }
    },
    [switchChainInternal, t],
  );

  const switchChainAsync = useCallback(
    async (chainId: number) => {
      try {
        const addEthereumChainParameter = getChainAddEthereumChainParameter(chainId);
        return await switchChainAsyncInternal({ chainId, addEthereumChainParameter });
      } catch (error) {
        console.error(error);
        toast.error(t('common.toasts.switch_chain_failed'));
        throw error;
      }
    },
    [switchChainAsyncInternal, t],
  );

  return { switchChain, switchChainAsync, canSwitchChain };
};
