'use client';

import { useAsyncCallback } from 'react-async-hook';
import type { WalletClient } from 'viem';
import { getWalletClient } from 'wagmi/actions';
import { wagmiConfig } from './EthereumProvider';
import { useSwitchChain } from './useSwitchChain';

// Ensures the connected wallet is on target chain, then returns a fresh WalletClient for that chain
export const useEnsureWalletClient = () => {
  const { switchChainAsync } = useSwitchChain();

  const { execute: ensureWalletClient, loading: isLoading } = useAsyncCallback(
    async (chainId: number): Promise<WalletClient> => {
      // Attempt to switch chain first (wallets that can't switch will throw and be handled by existing toasts)
      await switchChainAsync(chainId);

      const client = await getWalletClient(wagmiConfig, { chainId });
      if (!client) throw new Error('Please connect your web3 wallet to a supported network');

      return client;
    },
  );

  return { ensureWalletClient, isLoading };
};
