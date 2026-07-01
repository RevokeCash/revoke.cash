'use client';

import { useCsrRouter } from 'lib/i18n/csr-navigation';
import { usePathname } from 'lib/i18n/navigation';
import { wagmiConfig } from 'lib/utils/wagmi';
import { memo, type ReactNode, useEffect } from 'react';
import { useConnect, useConnection, useConnectors, WagmiProvider } from 'wagmi';

interface Props {
  children: ReactNode;
}

export const EthereumProvider = ({ children }: Props) => {
  return (
    <WagmiProvider config={wagmiConfig} reconnectOnMount>
      <AutoConnect>{children}</AutoConnect>
    </WagmiProvider>
  );
};

const AutoConnect = memo(({ children }: Props) => {
  const { mutateAsync: connectAsync } = useConnect();
  const connectors = useConnectors();
  const { connector, address } = useConnection();
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
});

const isIframe = () => {
  return window?.parent !== window;
};

const isLedgerLive = () => {
  return (window as any)?.ethereum?.isLedgerLive;
};
