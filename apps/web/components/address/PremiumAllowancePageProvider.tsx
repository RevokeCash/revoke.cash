'use client';

import { useAddress } from 'lib/hooks/page-context/AddressIdentityContext';
import { PremiumAddressPageContextProvider } from 'lib/hooks/page-context/PremiumAddressPageContext';
import { TimeMachineProvider } from 'lib/hooks/page-context/TimeMachineContext';
import { removeSearchParam } from 'lib/i18n/csr-navigation';
import { type ReactNode, useEffect } from 'react';

interface Props {
  children: ReactNode;
}

const PremiumAllowancePageProvider = ({ children }: Props) => {
  const { address, domainName } = useAddress();

  // Premium multichain view doesn't use chainId — strip it from the URL if present
  useEffect(() => {
    removeSearchParam('chainId');
  }, []);

  return (
    <TimeMachineProvider>
      <PremiumAddressPageContextProvider address={address} domainName={domainName}>
        {children}
      </PremiumAddressPageContextProvider>
    </TimeMachineProvider>
  );
};

export default PremiumAllowancePageProvider;
