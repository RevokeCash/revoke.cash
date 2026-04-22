'use client';

import { createViemPublicClientForChain, getViemChainConfig, ORDERED_CHAINS } from 'lib/utils/chains';
import { memo, type ReactNode, useEffect, useMemo, useState } from 'react';
import type { Chain } from 'viem';
import { createConfig, useConnect, useConnection, useConnectors, WagmiProvider } from 'wagmi';
import { AutoConnectStatusProvider, useEmbedConfig } from './context';
import type { AutoConnectStatus } from './types';

interface Props {
  children: ReactNode;
}

export const EmbedEthereumProvider = ({ children }: Props) => {
  const { connectors } = useEmbedConfig();

  const wagmiConfig = useMemo(
    () =>
      createConfig({
        chains: ORDERED_CHAINS.map(getViemChainConfig) as [Chain, ...Chain[]],
        connectors,
        client: ({ chain }) => {
          return createViemPublicClientForChain(chain.id) as any;
        },
        ssr: true,
        batch: { multicall: true } as any,
        multiInjectedProviderDiscovery: false,
      }),
    [connectors],
  );

  return (
    <WagmiProvider config={wagmiConfig} reconnectOnMount>
      <AutoConnect>{children}</AutoConnect>
    </WagmiProvider>
  );
};

const AutoConnect = memo(({ children }: Props) => {
  const { detectAutoConnect, onConnected } = useEmbedConfig();
  const { mutateAsync: connectAsync } = useConnect();
  const connectors = useConnectors();
  const { connector } = useConnection();
  const [status, setStatus] = useState<AutoConnectStatus>('connecting');

  // biome-ignore lint/correctness/useExhaustiveDependencies: this hook was checked manually to ensure relevant dependencies are included
  useEffect(() => {
    const autoConnect = async () => {
      try {
        const targetConnectorId = await detectAutoConnect();
        if (!targetConnectorId) {
          setStatus('failed');
          return;
        }

        const targetConnector = connectors?.find((c) => c.id === targetConnectorId);
        if (!targetConnector) {
          setStatus('failed');
          return;
        }

        // Already connected to the right connector
        if (connector === targetConnector) {
          setStatus('connected');
          return;
        }

        await connectAsync({ connector: targetConnector });
        await onConnected?.();
        setStatus('connected');
      } catch (error) {
        console.error('Auto-connect failed:', error);
        setStatus('failed');
      }
    };

    autoConnect();
  }, [connectors, connector]);

  return <AutoConnectStatusProvider value={status}>{children}</AutoConnectStatusProvider>;
});
