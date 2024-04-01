import { createViemPublicClientForChain, getViemChainConfig, ORDERED_CHAINS } from 'lib/utils/chains';
import { SECOND } from 'lib/utils/time';
import { ReactNode, useEffect } from 'react';
import { Chain } from 'viem';
import { createConfig, useAccount, useConnect, WagmiProvider } from 'wagmi';
import { coinbaseWallet, injected, safe, walletConnect } from 'wagmi/connectors';

interface Props {
  children: ReactNode;
}

export const connectors = [
  safe({ debug: false }),
  injected(),
  walletConnect({
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
    metadata: {
      name: 'Revoke.cash',
      description:
        'Take back control of your wallet and stay safe by revoking token approvals and permissions you granted on Ethereum and over 80 other networks.',
      url: 'https://revoke.cash',
      icons: [
        'https://revoke.cash/assets/images/revoke-icon.svg',
        'https://revoke.cash/assets/images/apple-touch-icon.png',
      ],
    },
  }),
  coinbaseWallet({ appName: 'Revoke.cash' }),
];

export const wagmiConfig = createConfig({
  chains: ORDERED_CHAINS.map(getViemChainConfig) as [Chain, ...Chain[]],
  connectors,
  // @ts-ignore TODO: This gives a TypeScript error since Wagmi v2
  client: ({ chain }) => {
    return createViemPublicClientForChain(chain.id) as any;
  },
  ssr: true,
  batch: { multicall: true },
  cacheTime: 4 * SECOND,
});

export const EthereumProvider = ({ children }: Props) => {
  return (
    <WagmiProvider config={wagmiConfig} reconnectOnMount>
      <EthereumProviderChild>{children}</EthereumProviderChild>
    </WagmiProvider>
  );
};

const EthereumProviderChild = ({ children }: Props) => {
  const { connect, connectors } = useConnect();
  const { connector } = useAccount();

  // If the Safe connector is available, connect to it even if other connectors are available
  // (if another connector auto-connects (or user disconnects), we still override it with the Safe connector)
  useEffect(() => {
    const safeConnector = connectors?.find((connector) => connector.id === 'safe');
    if (!safeConnector || connector === safeConnector) return;

    // Only supported in an iFrame context
    if (typeof window === 'undefined' || window?.parent === window) return;

    connect({ connector: safeConnector });
  }, [connectors, connector]);

  return <>{children}</>;
};
