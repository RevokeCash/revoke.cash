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
    const rpcUrl = getChainRpcUrl(selectedChainId, process.env.NEXT_PUBLIC_INFURA_API_KEY);
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

export const useAddressPageContext = () => useContext(AddressPageContext);
