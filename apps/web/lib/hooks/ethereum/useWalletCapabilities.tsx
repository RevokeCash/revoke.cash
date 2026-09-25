import { supportsAtomicBatch } from '@revoke.cash/core/eip5792';
import { useMemo } from 'react';
import { useAccountCapabilities } from './useAccountCapabilities';

export const useWalletCapabilities = (chainId: number) => {
  const { capabilities, isLoading } = useAccountCapabilities();

  const supportsEip5792 = useMemo(() => {
    if (isLoading) return null;
    return supportsAtomicBatch(capabilities?.[chainId]);
  }, [isLoading, capabilities, chainId]);

  return { isLoading, capabilities, supportsEip5792 };
};
