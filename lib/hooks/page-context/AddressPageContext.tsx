import { isSupportedChain } from 'lib/utils/chains';
import { useRouter } from 'next/router';
import React, { ReactNode, useContext, useEffect, useState } from 'react';
import useLocalStorage from 'use-local-storage';
import { Address } from 'viem';
import { useAccount } from 'wagmi';
import { useEvents } from '../ethereum/events/useEvents';
import { useAllowances } from '../ethereum/useAllowances';

interface AddressContext {
  address?: Address;
  selectedChainId?: number;
  selectChain?: (chainId: number) => void;
  eventContext?: ReturnType<typeof useEvents>;
  allowanceContext?: ReturnType<typeof useAllowances>;
  signatureNoticeAcknowledged?: boolean;
  acknowledgeSignatureNotice?: () => void;
}

interface Props {
  children: ReactNode;
  address: Address;
  initialChainId?: number;
}

const AddressPageContext = React.createContext<AddressContext>({});

export const AddressPageContextProvider = ({ children, address, initialChainId }: Props) => {
  const router = useRouter();
  const { chain } = useAccount();

  // The default selected chain ID is either the chainId query parameter, the connected chain ID, or 1 (Ethereum)
  const queryChainId = parseInt(router.query.chainId as string);
  const defaultChainId = [initialChainId, queryChainId, chain?.id, 1].find((chainId) => isSupportedChain(chainId));
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
  allowanceContext.error = allowanceContext?.error || eventContext?.error;
  allowanceContext.isLoading =
    (allowanceContext?.isLoading || eventContext?.isLoading || !allowanceContext?.allowances) &&
    !allowanceContext?.error;

  const [signatureNoticeAcknowledged, setAcknowledged] = useLocalStorage('signature-notice-acknowledged', false);
  const acknowledgeSignatureNotice = () => setAcknowledged(true);

  return (
    <AddressPageContext.Provider
      value={{
        address,
        selectedChainId,
        selectChain,
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
