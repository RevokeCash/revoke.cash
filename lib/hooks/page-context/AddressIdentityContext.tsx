'use client';

import { usePathname } from 'next/navigation';
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
}

export const AddressIdentityContext = createContext<AddressIdentityContextValue>(undefined as any);

export const AddressIdentityContextProvider = ({ children, address, domainName: initialDomainName }: Props) => {
  const { domainName: resolvedDomainName } = useNameLookup(initialDomainName ? undefined : address);
  const pathname = usePathname();

  const domainName = initialDomainName ?? resolvedDomainName ?? undefined;
  const isPremium = pathname.includes('/premium');

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
