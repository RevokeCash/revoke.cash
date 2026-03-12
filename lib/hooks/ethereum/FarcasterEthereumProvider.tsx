'use client';

import farcasterSdk from '@farcaster/miniapp-sdk';
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector';
import { createViemPublicClientForChain, getViemChainConfig, ORDERED_CHAINS } from 'lib/utils/chains';
import { memo, type ReactNode, useEffect } from 'react';
import type { Chain } from 'viem';
import { createConfig, useConnect, useConnection, useConnectors, WagmiProvider } from 'wagmi';

interface Props {
  children: ReactNode;
}

export const connectors = [farcasterMiniApp()];

export const wagmiConfig = createConfig({
  chains: ORDERED_CHAINS.map(getViemChainConfig) as [Chain, ...Chain[]],
  connectors,
  client: ({ chain }) => {
    return createViemPublicClientForChain(chain.id) as any;
  },
  ssr: true,
  batch: { multicall: true } as any,
});

export const FarcasterEthereumProvider = ({ children }: Props) => {
  return (
    <WagmiProvider config={wagmiConfig} reconnectOnMount>
      <AutoConnect>{children}</AutoConnect>
    </WagmiProvider>
  );
};

const AutoConnect = memo(({ children }: Props) => {
  const { mutateAsync: connectAsync } = useConnect();
  const connectors = useConnectors();
  const { connector } = useConnection();

  // Auto-connect to Farcaster connector if inside a Farcaster mini-app
  // biome-ignore lint/correctness/useExhaustiveDependencies: this hook was checked manually to ensure relevant dependencies are included
  useEffect(() => {
    const autoConnect = async () => {
      if (!(await farcasterSdk.isInMiniApp())) return;

      const farcasterConnector = connectors?.find((c) => c.id === 'farcaster');
      if (!farcasterConnector || connector === farcasterConnector) return;

      await connectAsync({ connector: farcasterConnector }).catch(console.error);
      await farcasterSdk.actions.ready().catch(console.error);
    };

    autoConnect();
  }, [connectors, connector]);

  return <>{children}</>;
});
