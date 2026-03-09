'use client';

import { createContext, type ReactNode, useContext } from 'react';
import type { Address } from 'viem';
import { useNameLookup } from '../ethereum/useNameLookup';

interface AddressIdentityContextValue {
  address: Address;
  domainName?: string;
  isPremium: boolean;
}

interface Props {
  children: ReactNode;
  address: Address;
  domainName?: string | null;
  isPremium?: boolean;
}

export const AddressIdentityContext = createContext<AddressIdentityContextValue>(undefined as any);

export const AddressIdentityContextProvider = ({
  children,
  address,
  domainName: initialDomainName,
  isPremium = false,
}: Props) => {
  const { domainName: resolvedDomainName } = useNameLookup(initialDomainName ? undefined : address);

  const domainName = initialDomainName ?? resolvedDomainName ?? undefined;

  return (
    <AddressIdentityContext.Provider value={{ address, domainName, isPremium }}>
      {children}
    </AddressIdentityContext.Provider>
  );
};

export const useAddress = () => {
  const context = useContext(AddressIdentityContext);
  if (!context) {
    throw new Error('useAddressIdentityContext must be used within an AddressIdentityContextProvider');
  }
  return context;
};
