import { chains } from 'eth-chains';
import {
  getChainExplorerUrl,
  getChainName,
  getChainNativeToken,
  getChainRpcUrl,
  SUPPORTED_CHAINS,
} from 'lib/utils/chains';
import { revokeProvider } from 'lib/utils/revokeProvider';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { configureChains, createClient, useConnect, WagmiConfig } from 'wagmi';
import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { LedgerConnector } from 'wagmi/connectors/ledger';
import { SafeConnector } from 'wagmi/connectors/safe';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';

interface Props {
  children: ReactNode;
}

// TODO: make this better
const chainList = SUPPORTED_CHAINS.map((chainId) => {
  const chainInfo = chains.get(chainId);
  const chainName = getChainName(chainId);
  const fallbackNativeCurrency = { name: chainName, symbol: getChainNativeToken(chainId), decimals: 18 };
  return {
    id: chainId,
    network: chainName.toLowerCase().replaceAll(' ', '-'),
    name: chainName,
    nativeCurrency: chainInfo?.nativeCurrency ?? fallbackNativeCurrency,
    rpcUrls: {
      default: { http: [getChainRpcUrl(chainId, process.env.NEXT_PUBLIC_INFURA_API_KEY)] },
      public: { http: [getChainRpcUrl(chainId, process.env.NEXT_PUBLIC_INFURA_API_KEY)] },
    },
    blockExplorers: {
      default: {
        name: chainName + ' Explorer',
        url: getChainExplorerUrl(chainId),
      },
    },
  };
});

const { chains: wagmiChains, provider } = configureChains(chainList, [revokeProvider()]);

// We don't want to auto-disconnect the user when they switch to certain networks
// https://github.com/MetaMask/metamask-extension/issues/13375#issuecomment-1027663334
class InjectedConnectorNoDisconnectListener extends InjectedConnector {
  protected onDisconnect = () => {};
}

export const EthereumProvider = ({ children }: Props) => {
  // We need to use a state variable here because we need to dynamically add the injected connector later
  // This is because a new Phantom update messes with the window.ethereum object and causes it to be undefined on page load
  // So we wait for 100ms before adding the injected connector
  // TODO: Go back to normal once Phantom fixes their bug
  const [connectors, setConnectors] = useState<any[]>([
    new SafeConnector({
      chains: wagmiChains,
      options: { allowedDomains: [/gnosis-safe.io$/, /app.safe.global$/], debug: false },
    }),
    // new InjectedConnectorNoDisconnectListener({ chains: wagmiChains }),
    new WalletConnectConnector({ chains: wagmiChains, options: { qrcode: true } }),
    new CoinbaseWalletConnector({ chains: wagmiChains, options: { appName: 'Revoke.cash' } }),
    new LedgerConnector({ chains: wagmiChains }),
  ]);

  // See comment above
  useEffect(() => {
    setTimeout(() => {
      setConnectors(() => [new InjectedConnectorNoDisconnectListener({ chains: wagmiChains }), ...connectors]);
    }, 100);
  }, []);

  const wagmiClient = useMemo(
    () =>
      createClient({
        autoConnect: true,
        connectors,
        provider,
      }),
    [connectors]
  );

  return (
    <WagmiConfig client={wagmiClient}>
      <EthereumProviderChild>{children}</EthereumProviderChild>
    </WagmiConfig>
  );
};

const EthereumProviderChild = ({ children }: Props) => {
  const { connect, connectors } = useConnect();

  // Add a migration from web3modal to wagmi so users don't need to reconnect
  // TODO: Remove this around May 2023, when people have migrated
  useEffect(() => {
    if (!connectors) return;

    const migrateWeb3Modal = async (connectorKey: string) => {
      // Sleep for 500ms to prevent weird bugs (this is OK since this is only for migration)
      await new Promise((resolve) => setTimeout(resolve, 500));

      const replacementConnectors = {
        '"injected"': 'injected',
        '"walletconnect"': 'walletConnect',
        '"coinbasewallet"': 'coinbaseWallet',
      };

      const connector = connectors.find((connector) => connector.id === replacementConnectors[connectorKey]);
      connect({ connector });

      window.localStorage.removeItem('WEB3_CONNECT_CACHED_PROVIDER');
    };

    const WEB3MODAL_CONNECTOR = window.localStorage.getItem('WEB3_CONNECT_CACHED_PROVIDER');
    if (WEB3MODAL_CONNECTOR) {
      migrateWeb3Modal(WEB3MODAL_CONNECTOR);
    }
  }, [connectors]);

  return <>{children}</>;
};
