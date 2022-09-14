import { providers as multicall } from '@0xsequence/multicall';
import { track } from '@amplitude/analytics-browser';
import CoinbaseWalletSDK from '@coinbase/wallet-sdk';
import { JsonRpcSigner, Web3Provider } from '@ethersproject/providers';
import { SafeAppWeb3Modal as Web3Modal } from '@gnosis.pm/safe-apps-web3modal';
import WalletConnectProvider from '@walletconnect/web3-provider';
import { SUPPORTED_NETWORKS } from 'components/common/constants';
import { getChainRpcUrl, lookupEnsName } from 'components/common/util';
import { chains } from 'eth-chains';
import { providers, utils } from 'ethers';
import React, { ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { useAsync } from 'react-async-hook';

declare let window: {
  ethereum?: any;
  web3?: any;
  location: any;
};

interface EthereumContext {
  provider?: multicall.MulticallProvider;
  fallbackProvider?: providers.Provider;
  signer?: JsonRpcSigner;
  account?: string;
  ensName?: string;
  chainId?: number;
  chainName?: string;
  connect?: () => Promise<void>;
  disconnect?: () => Promise<void>;
}

const EthereumContext = React.createContext<EthereumContext>({});

interface Props {
  children: ReactNode;
}

const rpc = Object.fromEntries(
  SUPPORTED_NETWORKS.map((chainId) => [chainId, getChainRpcUrl(chainId, `${'88583771d63544aa'}${'ba1006382275c6f8'}`)])
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
      infuraId: `${'88583771d63544aa'}${'ba1006382275c6f8'}`,
    },
  },
};

// Note: accounts are converted to lowercase -> getAddress'ed everywhere, because different chains (like RSK)
// may have other checksums so we normalise it to ETH checksum
export const EthereumProvider = ({ children }: Props) => {
  const [web3ModalInstance, setWeb3ModalInstance] = useState<any>();
  const [provider, setProvider] = useState<multicall.MulticallProvider>();
  const [chainId, setChainId] = useState<number>();
  const [account, setAccount] = useState<string>();
  const [signer, setSigner] = useState<JsonRpcSigner>();
  const { result: ensName } = useAsync(() => lookupEnsName(account, provider), [account, provider, chainId], {
    setLoading: (state) => ({ ...state, loading: true }),
  });

  const chainName = useMemo(() => {
    return chains.get(chainId)?.name ?? `Network with chainId ${chainId}`;
  }, [chainId]);

  // The "fallback" provider is a wallet-independent provider that is used to retrieve logs
  // to ensure that custom RPCs don't break Revoke.cash functionality.
  // TODO: refactor/merge connectDefaultProvider and fallbackProvider
  const fallbackProvider = useMemo(() => {
    const rpcProvider = new providers.JsonRpcProvider(
      getChainRpcUrl(chainId ?? 1, `${'88583771d63544aa'}${'ba1006382275c6f8'}`),
      'any'
    );
    return rpcProvider;
  }, [chainId ?? 1]);

  const web3Modal = new Web3Modal({
    cacheProvider: true, // optional
    providerOptions, // required
  });

  useEffect(() => {
    if (account) {
      setSigner(((provider as any)?.provider as Web3Provider)?.getSigner(account));
    } else {
      setSigner(undefined);
    }
  }, [account]);

  const updateAccount = (newAccount?: string) => {
    if (newAccount) {
      setAccount(utils.getAddress(newAccount.toLowerCase()));
    } else {
      setAccount(undefined);
    }
  };

  const updateProvider = async (newProvider: providers.JsonRpcProvider, clearAccount: boolean = false) => {
    const { chainId: newChainId } = await newProvider.getNetwork();
    const newAccount = clearAccount ? undefined : await getConnectedAccount(newProvider);
    const multicallProvider = new multicall.MulticallProvider(newProvider, {
      verbose: true,
    });
    setProvider(multicallProvider);
    setChainId(newChainId);
    updateAccount(newAccount);
    if (!clearAccount) {
      track('Connected Wallet', { address: newAccount, chainId: newChainId });
    }
  };

  const connect = async () => {
    try {
      const instance = await web3Modal.requestProvider();

      const provider = new providers.Web3Provider(instance, 'any');
      await updateProvider(provider);

      // Remove all listeners on 'window.ethereum' in case a default provider was connected earlier
      window.ethereum?.removeAllListeners();

      instance.on('accountsChanged', (accounts: string[]) => {
        console.log('accounts changed to', accounts);
        updateAccount(accounts[0]);
      });

      instance.on('chainChanged', (receivedChainId: string | number) => {
        const newChainId = Number(receivedChainId);
        console.log('chain changed to', newChainId);
        setChainId(newChainId);
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
    await connectDefaultProvider();
  };

  const connectDefaultProvider = async () => {
    // If an injected provider exists, we want to use it for READ-ONLY access even if the user is not "connected"
    if (window.ethereum) {
      const provider = new providers.Web3Provider(window.ethereum, 'any');

      // Pass a flag to clear the currently connected 'account' since we only want to connect the account when the user clicks 'connect'
      await updateProvider(provider, true);

      // Make sure that the chain updates when the user changes their network (note that we add no handler for accounts here)
      window.ethereum.on('chainChanged', (receivedChainId: string | number) => {
        const newChainId = Number(receivedChainId);
        console.log('chain changed to', newChainId);
        setChainId(newChainId);
      });

      console.log('Using injected "window.ethereum" provider');
    } else {
      try {
        // Check that the provider is available (and not rate-limited) by sending a dummy request
        await fallbackProvider.getCode('0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', 'latest');
        await updateProvider(fallbackProvider);
        console.log('Using fallback Infura provider');
      } catch {
        console.log('No web3 provider available');
      }
    }
  };

  useEffect(() => {
    const startup = async () => {
      // Deals with the edge case of having previously connected using injected
      // but there is no longer an injected provider in the browser
      if (!window.ethereum && localStorage.getItem('WEB3_CONNECT_CACHED_PROVIDER') === '"injected"') {
        localStorage.removeItem('WEB3_CONNECT_CACHED_PROVIDER');
      }

      if ((await web3Modal.isSafeApp()) || localStorage.getItem('WEB3_CONNECT_CACHED_PROVIDER')) {
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
        provider,
        fallbackProvider,
        chainId,
        chainName,
        account,
        ensName,
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

export const useEthereum = () => {
  return useContext(EthereumContext);
};
