import { providers as multicall } from '@0xsequence/multicall';
import { track } from '@amplitude/analytics-browser';
import CoinbaseWalletSDK from '@coinbase/wallet-sdk';
import type { JsonRpcSigner } from '@ethersproject/providers';
import { SafeAppWeb3Modal as Web3Modal } from '@gnosis.pm/safe-apps-web3modal';
import WalletConnectProvider from '@walletconnect/web3-provider';
import { chains } from 'eth-chains';
import { providers, utils } from 'ethers';
import { SUPPORTED_CHAINS } from 'lib/constants';
import type { LogsProvider } from 'lib/interfaces';
import { BackendProvider } from 'lib/providers';
import {
  getChainExplorerUrl,
  getChainName,
  getChainRpcUrl,
  isBackendSupportedChain,
  isSupportedChain,
} from 'lib/utils/chains';
import { lookupEnsName, lookupUnsName } from 'lib/utils/whois';
import React, { ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAsync } from 'react-async-hook';

declare let window: {
  ethereum?: any;
  web3?: any;
  location: any;
};

interface EthereumContext {
  readProvider?: multicall.MulticallProvider;
  connectionType?: string;
  logsProvider?: LogsProvider;
  signer?: JsonRpcSigner;
  account?: string;
  ensName?: string;
  unsName?: string;
  connectedChainId?: number;
  selectedChainId?: number;
  selectChain?: (chainId: number) => void;
  switchInjectedWalletChain?: (chainId: number) => Promise<void>;
  connect?: () => Promise<void>;
  disconnect?: () => Promise<void>;
}

const EthereumContext = React.createContext<EthereumContext>({});

interface Props {
  children: ReactNode;
}

const rpc = Object.fromEntries(
  SUPPORTED_CHAINS.map((chainId) => [chainId, getChainRpcUrl(chainId, process.env.NEXT_PUBLIC_INFURA_API_KEY)])
);

const providerOptions = {
  walletconnect: {
    package: WalletConnectProvider,
    options: { rpc },
  },
  coinbasewallet: {
    package: CoinbaseWalletSDK,
    options: {
      appName: 'Revoke.cash',
      infuraId: process.env.NEXT_PUBLIC_INFURA_API_KEY,
    },
  },
};

// Note: accounts are converted to lowercase -> getAddress'ed everywhere, because different chains (like RSK)
// may have other checksums so we normalise it to ETH checksum
export const EthereumProvider = ({ children }: Props) => {
  const [web3ModalInstance, setWeb3ModalInstance] = useState<any>();
  const [connectedProvider, setConnectedProvider] = useState<multicall.MulticallProvider>();
  const [selectedChainId, setSelectedChainId] = useState<number>(1);
  const [connectedChainId, setConnectedChainId] = useState<number>();
  const [account, setAccount] = useState<string>();
  const [signer, setSigner] = useState<JsonRpcSigner>();

  const { result: ensName } = useAsync(lookupEnsName, [account]);
  const { result: unsName } = useAsync(lookupUnsName, [account]);

  // The "logs provider" is a wallet-independent provider that is used to retrieve logs
  // to ensure that custom RPCs don't break Revoke.cash functionality.
  const logsProvider = useMemo(() => {
    const rpcUrl = getChainRpcUrl(selectedChainId, process.env.NEXT_PUBLIC_INFURA_API_KEY);
    const rpcProvider = new providers.JsonRpcProvider(rpcUrl, selectedChainId);
    const backendProvider = new BackendProvider(selectedChainId);
    return isBackendSupportedChain(selectedChainId) ? backendProvider : rpcProvider;
  }, [selectedChainId]);

  const readProvider = useMemo(() => {
    // To keep costs at bay, we use the connected provider if possible
    if (selectedChainId === connectedChainId) return connectedProvider;

    const rpcUrl = getChainRpcUrl(selectedChainId, process.env.NEXT_PUBLIC_INFURA_API_KEY);
    const rpcProvider = new providers.JsonRpcProvider(rpcUrl, selectedChainId);
    return new multicall.MulticallProvider(rpcProvider, { verbose: true });
  }, [selectedChainId, connectedChainId]);

  const selectChain = useCallback(
    (newChainId: number) => {
      setSelectedChainId(newChainId);
      track('Selected Chain', { chainId: selectedChainId });
    },
    [selectedChainId]
  );

  // Switching wallet chains only works for injected wallets
  const switchInjectedWalletChain = useCallback(
    async (newChainId: number) => {
      if (connectedChainId === newChainId) return;

      const addEthereumChain = async (newChainId: number) => {
        const chainInfo = chains.get(newChainId);
        await window.ethereum?.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: `0x${newChainId.toString(16)}`,
              chainName: getChainName(newChainId),
              nativeCurrency: chainInfo.nativeCurrency,
              rpcUrls: [getChainRpcUrl(newChainId)],
              blockExplorerUrls: [getChainExplorerUrl(newChainId)],
              iconUrls: [chainInfo.icon],
            },
          ],
        });
      };

      const switchEthereumChain = async (newChainId: number) => {
        await window.ethereum?.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${newChainId.toString(16)}` }],
        });
      };

      try {
        await addEthereumChain(newChainId);
      } catch (error) {
        try {
          if (error?.code !== 4001) {
            await switchEthereumChain(newChainId);
          }
        } catch {
          // ignored
        }
      }

      track('Switch Wallet Chain', { from: connectedChainId, to: selectedChainId });
    },
    [connectedChainId, selectedChainId]
  );

  const web3Modal = useMemo(() => {
    const modal = new Web3Modal({
      cacheProvider: true, // optional
      providerOptions, // required
    });

    return modal;
  }, [providerOptions]);

  useEffect(() => {
    if (account) {
      setSigner(((connectedProvider as any)?.provider as providers.Web3Provider)?.getSigner(account));
    } else {
      setSigner(undefined);
    }
  }, [account, connectedProvider]);

  const updateAccount = (newAccount?: string) => {
    if (newAccount) {
      setAccount(utils.getAddress(newAccount.toLowerCase()));
    } else {
      setAccount(undefined);
    }
  };

  const updateProviderAndChainId = async (newProvider?: providers.JsonRpcProvider) => {
    if (newProvider) {
      const multicallProvider = new multicall.MulticallProvider(newProvider, { verbose: true });
      const { chainId } = await newProvider.getNetwork();
      setConnectedProvider(multicallProvider);
      setConnectedChainId(chainId);
    } else {
      setConnectedProvider(undefined);
      setConnectedChainId(undefined);
    }
  };

  const connect = async () => {
    try {
      const instance = await web3Modal.requestProvider();
      const provider = new providers.Web3Provider(instance, 'any');

      const { chainId } = await provider.getNetwork();
      const address = await getConnectedAccount(provider);

      updateProviderAndChainId(provider);
      updateAccount(address);

      // Automatically switch to the wallet's chain when connecting as long as no other chain was selected
      if (isSupportedChain(chainId) && selectedChainId === 1) setSelectedChainId(chainId);

      track('Connected Wallet', { address, chainId, connectionType: web3Modal.cachedProvider });

      // Remove all listeners on 'window.ethereum' in case a default provider was connected earlier
      window.ethereum?.removeAllListeners();

      instance.on('accountsChanged', (accounts: string[]) => {
        console.log('accounts changed to', accounts);
        updateAccount(accounts[0]);
      });

      instance.on('chainChanged', (receivedChainId: string | number) => {
        const newChainId = Number(receivedChainId);
        console.log('chain changed to', newChainId);
        setConnectedChainId(newChainId);
      });

      setWeb3ModalInstance(instance);
    } catch {
      // Ignored
    }
  };

  const disconnect = async () => {
    // Clear cached provider and 'walletconnect' localstorage items so that the connection does not get stuck on walletconnect
    web3Modal.clearCachedProvider();
    localStorage.removeItem('walletconnect');
    web3ModalInstance?.removeAllListeners();
    window.ethereum?.removeAllListeners();
    updateAccount(undefined);
    updateProviderAndChainId(undefined);
    await connectDefaultProvider();
  };

  const connectDefaultProvider = async () => {
    // If an injected provider exists, we want to use it for READ-ONLY access even if the user is not "connected"
    if (window.ethereum) {
      const provider = new providers.Web3Provider(window.ethereum, 'any');
      await updateProviderAndChainId(provider);

      // Make sure that the chain updates when the user changes their chain (note that we add no handler for accounts here)
      window.ethereum.on('chainChanged', (receivedChainId: string | number) => {
        const newChainId = Number(receivedChainId);
        console.log('chain changed to', newChainId);
        setConnectedChainId(newChainId);
      });

      console.log('Using injected "window.ethereum" provider');
    }
  };

  useEffect(() => {
    const startup = async () => {
      // Deals with the edge cases of e.g. user uninstalling MM between visits
      // or us removing support for a connection type
      const cannotConnectPreviouslyInjected = !window.ethereum && web3Modal.cachedProvider === 'injected';
      const removedConnectionType = ![...Object.keys(providerOptions), 'injected'].includes(web3Modal.cachedProvider);
      if (cannotConnectPreviouslyInjected || (web3Modal.cachedProvider && removedConnectionType)) {
        web3Modal.clearCachedProvider();
      }

      if ((await web3Modal.isSafeApp()) || web3Modal.cachedProvider) {
        await connect();
      } else {
        await connectDefaultProvider();
      }
    };

    startup();
  }, []);

  return (
    <EthereumContext.Provider
      value={{
        readProvider,
        connectionType: web3Modal.cachedProvider,
        logsProvider,
        connectedChainId,
        selectedChainId,
        selectChain,
        switchInjectedWalletChain,
        account,
        ensName,
        unsName,
        signer,
        connect,
        disconnect,
      }}
    >
      {children}
    </EthereumContext.Provider>
  );
};

const getConnectedAccount = async (provider: providers.JsonRpcProvider) => {
  try {
    return await provider?.getSigner().getAddress();
  } catch (e) {
    return undefined;
  }
};

export const useEthereum = () => useContext(EthereumContext);
