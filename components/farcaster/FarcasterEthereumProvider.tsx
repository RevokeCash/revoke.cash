'use client';

import { abstractWalletConnector } from '@abstract-foundation/agw-react/connectors';
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector';
import { ORDERED_CHAINS, createViemPublicClientForChain, getViemChainConfig } from 'lib/utils/chains';
import { type ReactNode, memo, useEffect } from 'react';
import type { Chain } from 'viem';
import { WagmiProvider, createConfig, useAccount, useConnect } from 'wagmi';
import { coinbaseWallet, injected, safe, walletConnect } from 'wagmi/connectors';

interface Props {
  children: ReactNode;
}

// Include Farcaster connector for the mini-app
const farcasterConnectors = [
  farcasterMiniApp(),
  safe({ debug: false }),
  injected(),
  walletConnect({
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
    metadata: {
      name: 'Revoke.cash',
      description:
        'Take back control of your wallet and stay safe by revoking token approvals and permissions you granted on Ethereum and over 100 other networks.',
      url: 'https://revoke.cash',
      icons: ['https://revoke.cash/assets/images/revoke-icon-orange-black.svg', 'https://revoke.cash/icon.png'],
    },
  }),
  coinbaseWallet({ appName: 'Revoke.cash' }),
  abstractWalletConnector(),
];

const farcasterWagmiConfig = createConfig({
  chains: ORDERED_CHAINS.map(getViemChainConfig) as [Chain, ...Chain[]],
  connectors: farcasterConnectors,
  client: ({ chain }) => {
    // biome-ignore lint/suspicious/noExplicitAny: For some reason, this is not typed correctly
    return createViemPublicClientForChain(chain.id) as any;
  },
  ssr: true,
  // biome-ignore lint/suspicious/noExplicitAny: For some reason, this is not typed correctly
  batch: { multicall: true } as any,
});

export const FarcasterEthereumProvider = ({ children }: Props) => {
  return (
    <WagmiProvider config={farcasterWagmiConfig} reconnectOnMount>
      <FarcasterEthereumProviderChild>{children}</FarcasterEthereumProviderChild>
    </WagmiProvider>
  );
};

const FarcasterEthereumProviderChild = memo(({ children }: Props) => {
  const { connectAsync, connectors } = useConnect();
  const { connector } = useAccount();

  // Auto-connect to Farcaster connector if available
  // biome-ignore lint/correctness/useExhaustiveDependencies: this hook was checked manually to ensure relevant dependencies are included
  useEffect(() => {
    const farcasterConnector = connectors?.find((connector) => connector.id === 'farcasterMiniApp');
    if (!farcasterConnector || connector === farcasterConnector) return;

    connectAsync({ connector: farcasterConnector }).catch(console.error);
  }, [connectors, connector]);

  return <>{children}</>;
});
