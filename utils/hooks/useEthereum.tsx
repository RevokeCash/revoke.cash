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
  location: any
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
      rpc: { // Public RPC providers https://chainlist.org/
        1 : `https://mainnet.infura.io/v3/${'88583771d63544aa'}${'ba1006382275c6f8'}`,
        10: 'https://mainnet.optimism.io', // Optimism
        25: 'https://evm.cronos.org', // Chronos
        30: 'https://public-node.rsk.co', // RSK
        40: 'https://rpc1.eu.telos.net/evm', // Telos
        56: 'https://bsc-dataseed4.defibit.io', // BSC
        100: 'https://gnosis-mainnet.public.blastapi.io', // Gnosis/xDai
        122: 'https://fuse-rpc.gateway.pokt.network', // Fuse
        128: 'https://http-mainnet.hecochain.com', // Heco
        137: 'https://polygon-rpc.com/', // Polygon
        250: 'https://fantom-mainnet.public.blastapi.io', // Fantom
        336: 'https://shiden.public.blastapi.io', // Shiden
        1088: 'https://andromeda.metis.io/?owner=1088', // Metis
        1284: 'https://moonbeam.public.blastapi.io', // Moonbeam
        1285: 'https://moonriver.public.blastapi.io', // Moonriver
        4689: 'https://rpc.ankr.com/iotex', // Iotex
        8217: 'https://public-node-api.klaytnapi.com/v1/cypress', // Klaytn
        10000: 'https://smartbch.devops.cash/mainnet', // SmartBCH
        42161: 'https://arb1.arbitrum.io/rpc', // Arbitrum
        43114: 'https://ava-mainnet.public.blastapi.io/ext/bc/C/rpc', // Avax
        1666600000: 'https://rpc.heavenswail.one', // Harmony
        11297108109: 'https://palm-mainnet.infura.io/v3/3a961d6501e54add9a41aa53f15de99b' // Palm
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


  // Deals with the edge case of having previously connected using injected
  // but there is no longer an injected provider in the browser
  (() => {
    const cached = localStorage.getItem('WEB3_CONNECT_CACHED_PROVIDER');
    if(!window.ethereum && cached === '"injected"'){
      localStorage.removeItem('WEB3_CONNECT_CACHED_PROVIDER')
    }
  })();

  const web3Modal = new Web3Modal({
    cacheProvider: true, // optional
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

  const updateProvider = async (newProvider: providers.JsonRpcProvider) => {
    const { chainId: newChainId } = await newProvider.getNetwork()
    const newAccount = await getConnectedAccount(newProvider)
    emitAnalyticsEvent(`connect_wallet_${newChainId}`)
    const multicallProvider = new multicall.MulticallProvider(newProvider, { verbose: true })
    setProvider(multicallProvider)
    setChainId(newChainId)
    updateAccount(newAccount)
  }

  const connect = async () => {
    const instance = await web3Modal.connect();
    const provider = new providers.Web3Provider(instance)
    await updateProvider(provider)
    const connectedAccount = await getConnectedAccount(provider)
    updateAccount(connectedAccount)

    instance.on("accountsChanged", (accounts: string[]) => {
      console.log('accounts changed to', accounts);
      updateAccount(accounts[0]);
    });

    instance.on("chainChanged", (id: number) => {
      const chainNumber = parseInt(id.toString(10));
      console.log('chain changed to', chainNumber);
      setChainId(chainNumber)
      window.location.reload(); // Reload is essential so that metamask gives a working provider
    });

    instance.on("connect", (info: { chainId: number }) => {
      console.log(info);
    });
    
    // Subscribe to provider disconnection
    instance.on("disconnect", (error: { code: number; message: string }) => {
      console.log(error);
    });
  }

  const disconnect = async (window: Window) => {
    web3Modal.clearCachedProvider();
    localStorage.removeItem('walletconnect'); //This is needed so a user is not STUCK using walletconnect when they refresh
    window.location.reload();
  }

  useEffect(() => {
    if(localStorage.getItem('WEB3_CONNECT_CACHED_PROVIDER')){
      connect()
      return
    }
    const connectDefaultProvider = async () => {
      try {
        // Use a default provider with a free Infura key if web3 is not available
        const newProvider = new providers.InfuraProvider('mainnet', `${'88583771d63544aa'}${'ba1006382275c6f8'}`)
        // Check that the provider is available (and not rate-limited) by sending a dummy request
        const dummyRequest = '{"method":"eth_getCode","params":["0x1f9840a85d5af5bf1d1762f925bdaddc4201f984","latest"],"id":0,"jsonrpc":"2.0"}'
        await axios.post(newProvider.connection.url, dummyRequest)
        await updateProvider(newProvider)
        console.log('Using fallback Infura provider')
      } catch {
        console.log('No web3 provider available')
      }
    }
    connectDefaultProvider()
  }, [])

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

