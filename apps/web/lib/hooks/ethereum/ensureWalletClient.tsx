'use client';

import { wagmiConfig } from 'lib/utils/wagmi';
import { useAsyncCallback } from 'react-async-hook';
import type { Account, Chain, Transport, WalletClient } from 'viem';
import { getWalletClient } from 'wagmi/actions';
import { useSwitchChain } from './useSwitchChain';

export type ConnectedWalletClient = WalletClient<Transport, Chain, Account>;

// Ensures the connected wallet is on target chain, then returns a fresh WalletClient for that chain
export const useEnsureWalletClient = () => {
  const { switchChainAsync } = useSwitchChain();

  const { execute: ensureWalletClient, loading: isLoading } = useAsyncCallback(
    async (chainId: number): Promise<ConnectedWalletClient> => {
      // Attempt to switch chain first (wallets that can't switch will throw and be handled by existing toasts)
      await switchChainAsync(chainId);

      const client = await getWalletClient(wagmiConfig, { chainId });
      if (!client) throw new Error('Please connect your web3 wallet to a supported network');

      return client as ConnectedWalletClient;
    },
  );

  return { ensureWalletClient, isLoading };
};
