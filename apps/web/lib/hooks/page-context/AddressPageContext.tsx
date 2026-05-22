'use client';

import { isSupportedChain } from '@revoke.cash/core/chains';
import { isNullish } from '@revoke.cash/core/utils';
import { useCsrRouter } from 'lib/i18n/csr-navigation';
import { usePathname } from 'lib/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import React, { type ReactNode, useContext, useLayoutEffect, useState } from 'react';
import type { Address } from 'viem';
import { useAddressData } from '../ethereum/useAddressData';

interface AddressContext {
  selectedChainId: number;
  selectChain: (chainId: number) => void;
  addressData: ReturnType<typeof useAddressData>;
}

interface Props {
  children: ReactNode;
  address: Address;
  initialChainId?: number;
  queryParams?: string[];
}

// We pass in undefined as the default value, since there should always be a provider for this context
export const AddressPageContext = React.createContext<AddressContext>(undefined as any);

export const AddressPageContextProvider = ({
  children,
  address,
  initialChainId,
  queryParams = ['chainId'], // default is only add chainId to the qs, not address
}: Props) => {
  const searchParams = useSearchParams()!;
  const path = usePathname();
  const router = useCsrRouter();

  // The default selected chain ID is either the chainId query parameter, the connected chain ID, or 1 (Ethereum)
  const queryChainId = Number(searchParams.get('chainId')) || undefined;
  const defaultChainId = [initialChainId, queryChainId, 1]
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

  const addressData = useAddressData(address, selectedChainId);

  return (
    <AddressPageContext.Provider
      value={{
        selectedChainId,
        selectChain,
        addressData,
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
  return context.addressData.eventContext;
};

export const useAddressAllowances = () => {
  const context = useAddressPageContext();
  return context.addressData.allowanceContext;
};
