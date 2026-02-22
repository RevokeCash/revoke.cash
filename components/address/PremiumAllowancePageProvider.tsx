'use client';

import { useAddress } from 'lib/hooks/page-context/AddressIdentityContext';
import { PremiumAddressPageContextProvider } from 'lib/hooks/page-context/PremiumAddressPageContext';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

const PremiumAllowancePageProvider = ({ children }: Props) => {
  const { address, domainName } = useAddress();

  return (
    <PremiumAddressPageContextProvider address={address} domainName={domainName}>
      {children}
    </PremiumAddressPageContextProvider>
  );
};

export default PremiumAllowancePageProvider;
