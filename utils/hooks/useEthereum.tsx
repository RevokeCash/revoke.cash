import { providers as multicall } from '@0xsequence/multicall';
import { JsonRpcSigner, Web3Provider } from '@ethersproject/providers';
import axios from 'axios';
import { emitAnalyticsEvent, lookupEnsName } from 'components/common/util';
import { chains } from 'eth-chains';
import { providers, utils } from 'ethers';
import React, { ReactNode, useContext, useEffect, useState } from 'react'
import { useAsync } from 'react-async-hook';

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
}

const EthereumContext = React.createContext<EthereumContext>({});

interface Props {
  children: ReactNode;
}

// Note: accounts are converted to lowercase -> getAddress'ed everywhere, because different chains (like RSK)
// may have other checksums so we normalise it to ETH checksum
export const EthereumProvider = ({ children }: Props) => {
  const [provider, setProvider] = useState<multicall.MulticallProvider>();
  const [chainId, setChainId] = useState<number>();
  const [chainName, setChainName] = useState<string>();
  const [account, setAccount] = useState<string>();
  const [signer, setSigner] = useState<JsonRpcSigner>();
  const { result: ensName } = useAsync(lookupEnsName, [account, provider], { setLoading: (state) => ({ ...state, loading: true }) });

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
    const [connectedAccount] = await window.ethereum.request({ method: 'eth_requestAccounts' })
    updateAccount(connectedAccount)
  }

  useEffect(() => {
    const updateProvider = async (newProvider: providers.JsonRpcProvider) => {
      const { chainId: newChainId } = await newProvider.getNetwork()
      const newAccount = await getConnectedAccount(newProvider);
      emitAnalyticsEvent(`connect_wallet_${newChainId}`)
      const multicallProvider = new multicall.MulticallProvider(newProvider, { verbose: true })
      setProvider(multicallProvider)
      setChainId(newChainId)
      updateAccount(newAccount)
    }

    const connectProvider = async () => {
      if (window.ethereum) {
        const provider = new providers.Web3Provider(window.ethereum, 'any')
        await updateProvider(provider)
        console.log('Using injected "window.ethereum" provider')
      } else {
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

      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        console.log('accounts changed to', accounts);
        updateAccount(accounts[0]);
      })

      window.ethereum.on('chainChanged', (chainIdHex: string) => {
        const chainIdDec = Number.parseInt(chainIdHex, 16)
        console.log('chain changed to', chainIdDec);
        setChainId(chainIdDec)
      })
    }

    connectProvider()
  }, [])

  return (
    <EthereumContext.Provider value={{ provider, chainId, chainName, account, ensName, signer, connect }} >
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

