import { isNullish } from '@revoke.cash/core/utils';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { Capabilities } from 'viem';
import { useWalletClient } from 'wagmi';

export const useWalletCapabilities = (chainId: number) => {
  const { data: walletClient } = useWalletClient();

  const { data: capabilities, isLoading } = useQuery({
    queryKey: ['wallet-capabilities', walletClient?.key],
    queryFn: async () => {
      if (!walletClient) return null;

      try {
        const capabilities = (await walletClient.getCapabilities()) as Capabilities;
        console.log('Wallet supports EIP5792:', capabilities);
        return capabilities;
      } catch {
        console.log('Wallet does not support EIP5792');
        return null;
      }
    },
    enabled: !isNullish(walletClient),
  });

  const supportsEip5792 = useMemo(() => {
    if (isLoading) return null;
    return !isNullish(capabilities?.[chainId]);
  }, [isLoading, capabilities, chainId]);

  return { isLoading, capabilities, supportsEip5792 };
};
