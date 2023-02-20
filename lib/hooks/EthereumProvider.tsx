import { chains } from 'eth-chains';
import {
  getChainExplorerUrl,
  getChainName,
  getChainNativeToken,
  getChainRpcUrl,
  SUPPORTED_CHAINS,
} from 'lib/utils/chains';
import { revokeProvider } from 'lib/utils/revokeProvider';
import { ReactNode } from 'react';
import { configureChains, createClient, WagmiConfig } from 'wagmi';
import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet';
import { InjectedConnector } from 'wagmi/connectors/injected';
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
  ],
  provider,
});

export const EthereumProvider = ({ children }: Props) => {
  return <WagmiConfig client={wagmiClient}>{children}</WagmiConfig>;
};
