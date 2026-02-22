'use client';

import { createContext, type ReactNode, useContext } from 'react';
import type { Address } from 'viem';
import { useNameLookup } from '../ethereum/useNameLookup';

interface AddressIdentityContextValue {
  address: Address;
  domainName?: string;
}

interface Props {
  children: ReactNode;
  address: Address;
  domainName?: string | null;
}

export const AddressIdentityContext = createContext<AddressIdentityContextValue>(undefined as any);

export const AddressIdentityContextProvider = ({ children, address, domainName }: Props) => {
  const { domainName: resolvedDomainName } = useNameLookup(domainName ? undefined : address);

  return (
    <AddressIdentityContext.Provider value={{ address, domainName: domainName ?? resolvedDomainName ?? undefined }}>
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
