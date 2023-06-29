import { chains } from '@revoke.cash/chains';
import {
  getChainExplorerUrl,
  getChainName,
  getChainNativeToken,
  getChainRpcUrl,
  SUPPORTED_CHAINS,
} from 'lib/utils/chains';
import { revokeProvider } from 'lib/utils/revokeProvider';
import { ReactNode, useEffect } from 'react';
import { configureChains, createClient, useAccount, useConnect, WagmiConfig } from 'wagmi';
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
      default: { http: [getChainRpcUrl(chainId)] },
      public: { http: [getChainRpcUrl(chainId)] },
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
  protected onDisconnect = async () => {};
}

export const connectors = [
  new SafeConnector({
    chains: wagmiChains,
    options: { debug: false },
  }),
  new InjectedConnectorNoDisconnectListener({ chains: wagmiChains }),
  new WalletConnectConnector({
    chains: wagmiChains,
    options: {
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
      metadata: {
        name: 'Revoke.cash',
        description:
          'Take back control of your wallet and stay safe by revoking token approvals and permissions you granted on Ethereum and over 40 other networks.',
        url: 'https://revoke.cash',
        icons: [
          'https://revoke.cash/assets/images/revoke-icon.svg',
          'https://revoke.cash/assets/images/apple-touch-icon.png',
        ],
      },
    },
  }),
  new CoinbaseWalletConnector({ chains: wagmiChains, options: { appName: 'Revoke.cash' } }),
  new LedgerConnector({ chains: wagmiChains }),
];

export const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
});

export const EthereumProvider = ({ children }: Props) => {
  return (
    <WagmiConfig client={wagmiClient}>
      <EthereumProviderChild>{children}</EthereumProviderChild>
    </WagmiConfig>
  );
};

const EthereumProviderChild = ({ children }: Props) => {
  const { connect, connectors } = useConnect();
  const { connector } = useAccount();

  // If the Safe connector is available, connect to it even if other connectors are available
  // (if another connector auto-connects (or user disconnects), we still override it with the Safe connector)
  useEffect(() => {
    const safeConnector = connectors?.find((connector) => connector.id === 'safe' && connector.ready);
    if (!safeConnector || connector === safeConnector) return;
    connect({ connector: safeConnector });
  }, [connectors, connector]);

  return <>{children}</>;
};
