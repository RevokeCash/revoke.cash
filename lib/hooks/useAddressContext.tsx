import { useQuery } from '@tanstack/react-query';
import { providers } from 'ethers';
import { LogsProvider } from 'lib/interfaces';
import { BackendProvider } from 'lib/providers';
import { getChainRpcUrl, isBackendSupportedChain } from 'lib/utils/chains';
import { getOpenSeaProxyAddress } from 'lib/utils/whois';
import React, { ReactNode, useContext, useMemo, useState } from 'react';
import { useNetwork } from 'wagmi';

interface AddressContext {
  address?: string;
  openSeaProxyAddress?: string;
  selectedChainId?: number;
  selectChain?: (chainId: number) => void;
  logsProvider?: LogsProvider;
  isLoading?: boolean;
}

interface Props {
  children: ReactNode;
  address: string;
}

const AddressPageContext = React.createContext<AddressContext>({});

export const AddressPageContextProvider = ({ children, address }: Props) => {
  const { chain } = useNetwork();

  const { data: openSeaProxyAddress, isLoading } = useQuery({
    queryKey: ['openSeaProxyAddress', address, { persist: true }],
    queryFn: () => getOpenSeaProxyAddress(address),
  });

  const [selectedChainId, selectChain] = useState<number>(chain?.id ?? 1);

  // The "logs provider" is a wallet-independent provider that is used to retrieve logs
  // to ensure that custom RPCs don't break Revoke.cash functionality.
  const logsProvider = useMemo(() => {
    const rpcUrl = getLogsProviderUrl(selectedChainId);
    const rpcProvider = new providers.JsonRpcProvider(rpcUrl, selectedChainId);
    const backendProvider = new BackendProvider(selectedChainId);
    return isBackendSupportedChain(selectedChainId) ? backendProvider : rpcProvider;
  }, [selectedChainId]);

  return (
    <AddressPageContext.Provider
      value={{
        address,
        openSeaProxyAddress,
        selectedChainId,
        selectChain,
        logsProvider,
        isLoading,
      }}
    >
      {children}
    </AddressPageContext.Provider>
  );
};

const getLogsProviderUrl = (chainId: number) => {
  // If an Infura API key is set, it should *always* be used for mainnet, even if the "regular" RPC URL is overridden
  // with the NEXT_PUBLIC_RPC_URLS environment variable. This is because Infura is the most reliable provider for logs.
  if (chainId === 1 && process.env.NEXT_PUBLIC_INFURA_API_KEY) {
    return `https://mainnet.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_API_KEY}`;
  }

  return getChainRpcUrl(chainId, process.env.NEXT_PUBLIC_INFURA_API_KEY);
};

export const useAddressPageContext = () => useContext(AddressPageContext);
