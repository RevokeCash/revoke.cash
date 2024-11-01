import { getChainAddEthereumChainParameter } from 'lib/utils/chains';
import { useCallback } from 'react';
import { useAccount, useSwitchChain as useSwitchChainInternal } from 'wagmi';

export const useSwitchChain = () => {
  const { switchChain: switchChainInternal, switchChainAsync: switchChainAsyncInternal } = useSwitchChainInternal();
  const { connector } = useAccount();
  const canSwitchChain = connector?.type === 'injected';

  const switchChain = useCallback(
    (chainId: number) => {
      const addEthereumChainParameter = getChainAddEthereumChainParameter(chainId);
      return switchChainInternal({ chainId, addEthereumChainParameter });
    },
    [switchChainInternal],
  );

  const switchChainAsync = useCallback(
    (chainId: number) => {
      const addEthereumChainParameter = getChainAddEthereumChainParameter(chainId);
      return switchChainAsyncInternal({ chainId, addEthereumChainParameter });
    },
    [switchChainAsyncInternal],
  );

  return { switchChain, switchChainAsync, canSwitchChain };
};
