import { providers as multicall } from '@0xsequence/multicall';
import { JsonRpcSigner, Web3Provider } from '@ethersproject/providers';
import axios from 'axios';
import { emitAnalyticsEvent, lookupEnsName } from 'components/common/util';
import { chains } from 'eth-chains';
import { providers, utils } from 'ethers';
import React, { ReactNode, useContext, useEffect, useState } from 'react'
import { useAsync } from 'react-async-hook';
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";



declare let window: {
  ethereum?: any
  web3?: any
}

interface EthereumContext {
  provider?: multicall.MulticallProvider;
  signer?: JsonRpcSigner;
  account?: string;
  ensName?: string;
  chainId?: number;
  chainName?: string;
  connect?: () => Promise<void>;
  disconnect?: (window: Window) => Promise<void>;
}

const EthereumContext = React.createContext<EthereumContext>({});

interface Props {
  children: ReactNode;
}

const providerOptions = {
  walletconnect: {
    package: WalletConnectProvider,
    options: {
      rpc: {
        137: 'https://polygon-rpc.com/' // Add more public RPC endpoints here
      }
    }
  }
}

// Note: accounts are converted to lowercase -> getAddress'ed everywhere, because different chains (like RSK)
// may have other checksums so we normalise it to ETH checksum
export const EthereumProvider = ({ children }: Props) => {
  const [provider, setProvider] = useState<multicall.MulticallProvider>();
  const [chainId, setChainId] = useState<number>();
  const [chainName, setChainName] = useState<string>();
  const [account, setAccount] = useState<string>();
  const [signer, setSigner] = useState<JsonRpcSigner>();
  const { result: ensName } = useAsync(() => lookupEnsName(account, provider), [account, provider, chainId]);

  const web3Modal = new Web3Modal({
    cacheProvider: false, // optional
    providerOptions // required
  });

  useEffect(() => {
    const newChainName = chains.get(chainId)?.name ?? `Network with chainId ${chainId}`;
    if (newChainName) setChainName(newChainName);
  }, [chainId])

  useEffect(() => {
    setSigner(((provider as any)?.provider as Web3Provider)?.getSigner(account));
  }, [account])

  const updateAccount = (newAccount?: string) => {
    if (newAccount) {
      setAccount(utils.getAddress(newAccount.toLowerCase()))
    }
  }

  const connect = async () => {
    const updateProvider = async (newProvider: providers.JsonRpcProvider) => {
      const { chainId: newChainId } = await newProvider.getNetwork()
      const newAccount = await getConnectedAccount(newProvider);
      emitAnalyticsEvent(`connect_wallet_${newChainId}`)
      const multicallProvider = new multicall.MulticallProvider(newProvider, { verbose: true })
      setProvider(multicallProvider)
      setChainId(newChainId)
      updateAccount(newAccount)
    }

    const instance = await web3Modal.connect();
    const provider = new providers.Web3Provider(instance)
    await updateProvider(provider);
    const connectedAccount = await getConnectedAccount(provider);
    updateAccount(connectedAccount)

    provider.on("accountsChanged", (accounts: string[]) => {
      console.log('accounts changed to', accounts);
      updateAccount(accounts[0]);
    });

    provider.on("chainChanged", (chainId: number) => {
      console.log('chain changed to', chainId);
      setChainId(chainId)
    });

  }

  const disconnect = async (window: Window) => {
    web3Modal.clearCachedProvider();
    localStorage.removeItem('walletconnect'); //This is needed so a user is not STUCK using walletconnect when they refresh
    window.location.reload();
  }

  return (
    <EthereumContext.Provider value={{ provider, chainId, chainName, account, ensName, signer, connect, disconnect }} >
      {children}
    </EthereumContext.Provider>
  );
}

const getConnectedAccount = async (provider: providers.JsonRpcProvider) => {
  try {
    return await provider?.getSigner().getAddress();
  } catch (e) {
    return undefined;
  }
}

export const useEthereum = () => {
  return useContext(EthereumContext);
}

