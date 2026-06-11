'use client';

import { useAsyncCallback } from 'react-async-hook';
import type { WalletClient } from 'viem';
import { useConnection } from 'wagmi';
import { getWalletClient } from 'wagmi/actions';
import { wagmiConfig } from './EthereumProvider';
import { useSwitchChain } from './useSwitchChain';

// Ensures the connected wallet is on target chain, then returns a fresh WalletClient for that chain
export const useEnsureWalletClient = () => {
  const { switchChainAsync } = useSwitchChain();
  const { chainId: currentChainId } = useConnection();

  const { execute: ensureWalletClient, loading: isLoading } = useAsyncCallback(
    async (chainId: number): Promise<WalletClient> => {
      // Only attempt chain switch when not already on the target chain. Wallets like Safe don't support
      // programmatic chain switching and would throw if attempting it when already on the right chain.
      if (currentChainId !== chainId) {
        await switchChainAsync(chainId);
      }

      const client = await getWalletClient(wagmiConfig, { chainId });
      if (!client) throw new Error('Please connect your web3 wallet to a supported network');

      return client;
    },
  );

  return { ensureWalletClient, isLoading };
};
