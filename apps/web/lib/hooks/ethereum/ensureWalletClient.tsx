'use client';

import { wagmiConfig } from 'lib/utils/wagmi';
import { useTranslations } from 'next-intl';
import { useAsyncCallback } from 'react-async-hook';
import type { Account, Chain, Transport, WalletClient } from 'viem';
import { getConnection, getWalletClient } from 'wagmi/actions';
import { useSwitchChain } from './useSwitchChain';

export type ConnectedWalletClient = WalletClient<Transport, Chain, Account>;

// Ensures the connected wallet is on target chain, then returns a fresh WalletClient for that chain
export const useEnsureWalletClient = () => {
  const t = useTranslations();
  const { switchChainAsync } = useSwitchChain();

  const { execute: ensureWalletClient, loading: isLoading } = useAsyncCallback(
    async (chainId: number): Promise<ConnectedWalletClient> => {
      // Read the connected chain at call time (not render time) so that consecutive calls within a single
      // flow (e.g. batch revokes with a fee payment) don't attempt to switch the chain more than once.
      const currentChainId = getConnection(wagmiConfig).chainId;

      // Only attempt chain switch when not already on the target chain. Wallets like Safe don't support
      // programmatic chain switching and would throw if attempting it when already on the right chain.
      if (currentChainId !== chainId) {
        await switchChainAsync(chainId);
      }

      const client = await getWalletClient(wagmiConfig, { chainId });
      if (!client) throw new Error(t('common.errors.messages.connect_wallet_to_supported_network'));

      return client as ConnectedWalletClient;
    },
  );

  return { ensureWalletClient, isLoading };
};
