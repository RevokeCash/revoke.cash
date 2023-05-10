import { providers } from 'ethers';
import { LogsProvider } from 'lib/interfaces';
import { isSupportedChain } from 'lib/utils/chains';
import { useRouter } from 'next/router';
import React, { ReactNode, useContext, useEffect, useState } from 'react';
import useLocalStorage from 'use-local-storage';
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
  signatureNoticeAcknowledged?: boolean;
  acknowledgeSignatureNotice?: () => void;
}

interface Props {
  children: ReactNode;
  address: string;
}

const AddressPageContext = React.createContext<AddressContext>({});

export const AddressPageContextProvider = ({ children, address }: Props) => {
  const router = useRouter();
  const { chain } = useNetwork();

  // The default selected chain ID is either the chainId query parameter, the connected chain ID, or 1 (Ethereum)
  const queryChainId = parseInt(router.query.chainId as string);
  const defaultChainId = isSupportedChain(queryChainId) ? queryChainId : isSupportedChain(chain?.id) ? chain?.id : 1;
  const [selectedChainId, selectChain] = useState<number>(defaultChainId);

  useEffect(() => {
    if (!router.query.chainId) {
      router.replace({ query: { ...router.query, chainId: selectedChainId } });
    }
  }, [router.query.chainId]);

  useEffect(() => {
    if (selectedChainId) {
      router.replace({ query: { ...router.query, chainId: selectedChainId } });
    }
  }, [selectedChainId]);

  const eventContext = useEvents(address, selectedChainId);
  const allowanceContext = useAllowances(address, eventContext?.events, selectedChainId);
  allowanceContext.isLoading = allowanceContext?.isLoading || eventContext?.isLoading;
  allowanceContext.error = allowanceContext?.error || eventContext?.error;

  const logsProvider = useLogsProvider({ chainId: selectedChainId });
  const readProvider = useProvider({ chainId: selectedChainId });

  const [signatureNoticeAcknowledged, setAcknowledged] = useLocalStorage('signature-notice-acknowledged', false);
  const acknowledgeSignatureNotice = () => setAcknowledged(true);

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
        signatureNoticeAcknowledged,
        acknowledgeSignatureNotice,
      }}
    >
      {children}
    </AddressPageContext.Provider>
  );
};

export const useAddressPageContext = () => useContext(AddressPageContext);

export const useAddressEvents = () => useContext(AddressPageContext).eventContext;
export const useAddressAllowances = () => useContext(AddressPageContext).allowanceContext;
