'use client';

import { erc7715ProviderActions } from '@metamask/smart-accounts-kit/actions';
import { isNullish } from '@revoke.cash/core/utils';
import { useQuery } from '@tanstack/react-query';
import { useConnection, useConnectorClient } from 'wagmi';

// ERC-7715 wallets advertise support through wallet_getSupportedExecutionPermissions.
// MetaMask stays allowlisted as a fallback in case it rejects the discovery call.
export const useErc7715Support = () => {
  const { connector } = useConnection();
  const { data: connectorClient } = useConnectorClient();

  const isMetaMaskConnector = connector?.id === 'io.metamask';

  const query = useQuery({
    queryKey: ['erc7715-support', connector?.id],
    queryFn: async () => {
      if (!connectorClient) return false;

      try {
        const walletClient = connectorClient.extend(erc7715ProviderActions());
        await walletClient.getSupportedExecutionPermissions();
        return true;
      } catch {
        return isMetaMaskConnector;
      }
    },
    enabled: !isNullish(connectorClient),
    staleTime: Number.POSITIVE_INFINITY,
  });

  return { supportsErc7715: query.data ?? isMetaMaskConnector, isLoading: query.isLoading };
};
