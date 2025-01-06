'use client';

import { abstractWalletConnector } from '@abstract-foundation/agw-react/connectors';
import { useCsrRouter } from 'lib/i18n/csr-navigation';
import { usePathname } from 'lib/i18n/navigation';
import { ORDERED_CHAINS, createViemPublicClientForChain, getViemChainConfig } from 'lib/utils/chains';
import { type ReactNode, useEffect } from 'react';
import type { Chain } from 'viem';
import { WagmiProvider, createConfig, useAccount, useConnect } from 'wagmi';
import { coinbaseWallet, injected, safe, walletConnect } from 'wagmi/connectors';

interface Props {
  children: ReactNode;
}

export const connectors = [
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

export const wagmiConfig = createConfig({
  chains: ORDERED_CHAINS.map(getViemChainConfig) as [Chain, ...Chain[]],
  connectors,
  client: ({ chain }) => {
    // biome-ignore lint/suspicious/noExplicitAny: For some reason, this is not typed correctly
    return createViemPublicClientForChain(chain.id) as any;
  },
  ssr: true,
  // biome-ignore lint/suspicious/noExplicitAny: For some reason, this is not typed correctly
  batch: { multicall: true } as any,
});

export const EthereumProvider = ({ children }: Props) => {
  return (
    <WagmiProvider config={wagmiConfig} reconnectOnMount>
      <EthereumProviderChild>{children}</EthereumProviderChild>
    </WagmiProvider>
  );
};

const EthereumProviderChild = ({ children }: Props) => {
  const { connectAsync, connectors } = useConnect();
  const { connector, address } = useAccount();
  const router = useCsrRouter();
  const pathName = usePathname();

  // If the Safe connector is available, connect to it even if other connectors are available
  // (if another connector auto-connects (or user disconnects), we still override it with the Safe connector)
  // biome-ignore lint/correctness/useExhaustiveDependencies: this hook was checked manually to ensure relevant dependencies are included
  useEffect(() => {
    // Only supported in an iFrame context
    if (!isIframe()) return;

    const safeConnector = connectors?.find((connector) => connector.id === 'safe');
    if (!safeConnector || connector === safeConnector) return;

    connectAsync({ connector: safeConnector })
      .then(({ accounts: [account] }) => {
        if (pathName === '/') {
          router.push(`/address/${account}`, { retainSearchParams: ['chainId'] });
        }
      })
      .catch(console.error);
  }, [connectors, connector]);

  // If the Ledger Live connector is available, connect to it even if other connectors are available
  // (if another connector auto-connects (or user disconnects), we still override it with the Ledger Live connector)
  // biome-ignore lint/correctness/useExhaustiveDependencies: this hook was checked manually to ensure relevant dependencies are included
  useEffect(() => {
    if (!isLedgerLive()) return;

    const injectedConnector = connectors?.find((connector) => connector.id === 'injected');
    if (!injectedConnector || connector === injectedConnector) return;

    connectAsync({ connector: injectedConnector })
      .then(({ accounts: [account] }) => {
        if (pathName === '/') {
          router.push(`/address/${account}`, { retainSearchParams: ['chainId'] });
        }
      })
      .catch(console.error);
  }, [connectors, connector]);

  // If connected through Ledger or iFrame, then we automatically redirect to the right address page when address changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: this hook was checked manually to ensure relevant dependencies are included
  useEffect(() => {
    if (!isIframe() && !isLedgerLive()) return;
    if (!address) return;

    if (pathName.startsWith('/address/') && !pathName.includes(address)) {
      router.push(`/address/${address}`, { retainSearchParams: ['chainId'] });
    }
  }, [address]);

  return <>{children}</>;
};

const isIframe = () => {
  return typeof window !== 'undefined' && window?.parent !== window;
};

const isLedgerLive = () => {
  return typeof window !== 'undefined' && window?.ethereum?.isLedgerLive;
};
