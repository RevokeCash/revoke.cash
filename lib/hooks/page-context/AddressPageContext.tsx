import { providers } from 'ethers';
import { LogsProvider } from 'lib/interfaces';
import React, { ReactNode, useContext, useState } from 'react';
import { useNetwork, useProvider } from 'wagmi';
import { useAllowances } from '../ethereum/useAllowances';
import { useEvents } from '../ethereum/useEvents';
import { useLogsProvider } from '../ethereum/useLogsProvider';

interface AddressContext {
  address?: string;
  selectedChainId?: number;
  selectChain?: (chainId: number) => void;
  readProvider?: providers.BaseProvider;
  logsProvider?: LogsProvider;
  eventContext?: ReturnType<typeof useEvents>;
  allowanceContext?: ReturnType<typeof useAllowances>;
}

interface Props {
  children: ReactNode;
  address: string;
}

const AddressPageContext = React.createContext<AddressContext>({});

export const AddressPageContextProvider = ({ children, address }: Props) => {
  const { chain } = useNetwork();

  const [selectedChainId, selectChain] = useState<number>(chain?.id ?? 1);

  const eventContext = useEvents(address, selectedChainId);
  const allowanceContext = useAllowances(address, eventContext?.events, selectedChainId);
  allowanceContext.isLoading = allowanceContext?.isLoading || eventContext?.isLoading;
  allowanceContext.error = allowanceContext?.error || eventContext?.error;

  const logsProvider = useLogsProvider({ chainId: selectedChainId });
  const readProvider = useProvider({ chainId: selectedChainId });

  return (
    <AddressPageContext.Provider
      value={{
        address,
        selectedChainId,
        selectChain,
        readProvider,
        logsProvider,
        eventContext,
        allowanceContext,
      }}
    >
      {children}
    </AddressPageContext.Provider>
  );
};

export const useAddressPageContext = () => useContext(AddressPageContext);

export const useAddressEvents = () => useContext(AddressPageContext).eventContext;
export const useAddressAllowances = () => useContext(AddressPageContext).allowanceContext;
