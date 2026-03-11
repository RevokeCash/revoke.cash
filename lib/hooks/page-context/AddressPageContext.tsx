'use client';

import { useCsrRouter } from 'lib/i18n/csr-navigation';
import { usePathname } from 'lib/i18n/navigation';
import { isNullish } from 'lib/utils';
import { isSupportedChain } from 'lib/utils/chains';
import { useSearchParams } from 'next/navigation';
import React, { type ReactNode, useContext, useLayoutEffect, useState } from 'react';
import useLocalStorage from 'use-local-storage';
import type { Address } from 'viem';
import { useAccount } from 'wagmi';
import { useEvents } from '../ethereum/events/useEvents';
import { useAllowances } from '../ethereum/useAllowances';
import { useNameLookup } from '../ethereum/useNameLookup';

interface AddressContext {
  address: Address;
  domainName?: string;
  selectedChainId: number;
  selectChain: (chainId: number) => void;
  eventContext: ReturnType<typeof useEvents>;
  allowanceContext: ReturnType<typeof useAllowances>;
  signatureNoticeAcknowledged: boolean;
  acknowledgeSignatureNotice: () => void;
}

interface Props {
  children: ReactNode;
  address: Address;
  domainName?: string | null;
  initialChainId?: number;
  queryParams?: string[];
}

// We pass in undefined as the default value, since there should always be a provider for this context
export const AddressPageContext = React.createContext<AddressContext>(undefined as any);

export const AddressPageContextProvider = ({
  children,
  address,
  domainName,
  initialChainId,
  queryParams = ['chainId'], // default is only add chainId to the qs, not address
}: Props) => {
  const searchParams = useSearchParams()!;
  const path = usePathname();
  const router = useCsrRouter();
  const { chain } = useAccount();
  const { domainName: resolvedDomainName } = useNameLookup(domainName ? undefined : address);

  // The default selected chain ID is either the chainId query parameter, the connected chain ID, or 1 (Ethereum)
  const queryChainId = Number(searchParams.get('chainId')) || undefined;
  const defaultChainId = [initialChainId, queryChainId, chain?.id, 1]
    .filter((chainId) => !isNullish(chainId))
    .find((chainId) => isSupportedChain(chainId)) as number;
  const [selectedChainId, selectChain] = useState<number>(defaultChainId);

  // Note: We use useLayoutEffect here, because this is the only setup that works with the "spenderSearch" query param as well
  // biome-ignore lint/correctness/useExhaustiveDependencies(path): We don't want this to re-run when path changes
  useLayoutEffect(() => {
    const newSearchParams = new URLSearchParams(Array.from(searchParams.entries()));

    const updateChainId = () => {
      if (!queryParams?.includes('chainId')) return;
      if (!selectedChainId) return;
      if (searchParams.get('chainId') === selectedChainId.toString()) return;
      newSearchParams.set('chainId', selectedChainId.toString());
    };

    const updateAddress = () => {
      if (!queryParams?.includes('address')) return;
      if (!address) return;
      if (searchParams.get('address') === address) return;
      newSearchParams.set('address', address);
    };

    updateChainId();
    updateAddress();

    const qs = newSearchParams.toString();
    if (qs === searchParams.toString()) return;

    router.replace(`${path}${qs ? `?${qs}` : ''}`, { showProgress: false });
  }, [selectedChainId, address, searchParams, router, queryParams]);

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
        domainName: domainName ?? resolvedDomainName ?? undefined,
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

export const useAddressPageContext = () => {
  const context = useContext(AddressPageContext);
  if (!context) {
    throw new Error('useAddressPageContext must be used within an AddressPageContextProvider');
  }
  return context;
};

export const useAddressEvents = () => {
  const context = useAddressPageContext();
  return context.eventContext;
};

export const useAddressAllowances = () => {
  const context = useAddressPageContext();
  return context.allowanceContext;
};
