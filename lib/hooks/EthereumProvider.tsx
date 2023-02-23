import { chains } from 'eth-chains';
import {
  getChainExplorerUrl,
  getChainName,
  getChainNativeToken,
  getChainRpcUrl,
  SUPPORTED_CHAINS,
} from 'lib/utils/chains';
import { revokeProvider } from 'lib/utils/revokeProvider';
import { useRouter } from 'next/router';
import { ReactNode, useEffect } from 'react';
import { configureChains, createClient, WagmiConfig } from 'wagmi';
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

const wagmiClient = createClient({
  autoConnect: true,
  connectors: [
    new SafeConnector({
      chains: wagmiChains,
      options: { allowedDomains: [/gnosis-safe.io$/, /app.safe.global$/], debug: false },
    }),
    new InjectedConnector({ chains: wagmiChains }),
    new WalletConnectConnector({ chains: wagmiChains, options: { qrcode: true } }),
    new CoinbaseWalletConnector({ chains: wagmiChains, options: { appName: 'Revoke.cash' } }),
    new LedgerConnector({ chains: wagmiChains }),
  ],
  provider,
});

export const EthereumProvider = ({ children }: Props) => {
  const router = useRouter();

  // Smooth migration between web3modal and wagmi by migrating the localstorage from web3modal to wagmi
  // Would be nicer without the reload, but it's not a big deal since it's only for the migration
  useEffect(() => {
    const WEB3MODAL_CONNECTOR = window.localStorage.getItem('WEB3_CONNECT_CACHED_PROVIDER');
    if (WEB3MODAL_CONNECTOR) {
      const replacementConnectors = {
        '"injected"': '"injected"',
        '"walletconnect"': '"walletConnect"',
        '"coinbasewallet"': '"coinbaseWallet"',
      };

      window.localStorage.removeItem('WEB3_CONNECT_CACHED_PROVIDER');
      window.localStorage.setItem('wagmi.wallet', replacementConnectors[WEB3MODAL_CONNECTOR]);
      window.localStorage.setItem('wagmi.connected', 'true');
      if (WEB3MODAL_CONNECTOR === '"injected"') window.localStorage.setItem('wagmi.injected.shimDisconnect', 'true');
      router.reload();
    }
  }, []);

  return <WagmiConfig client={wagmiClient}>{children}</WagmiConfig>;
};
