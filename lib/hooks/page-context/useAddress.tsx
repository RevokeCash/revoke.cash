'use client';

import { useContext } from 'react';
import { AddressPageContext } from './AddressPageContext';
import { PremiumAddressPageContext } from './PremiumAddressPageContext';

/**
 * Hook that works in both regular and premium contexts to get the current address.
 * This allows components to work in both single-chain and multi-chain scenarios.
 */
export const useAddress = () => {
  const regularContext = useContext(AddressPageContext);
  const premiumContext = useContext(PremiumAddressPageContext);

  if (regularContext?.address) {
    return {
      address: regularContext.address,
      domainName: regularContext.domainName,
    };
  }

  if (premiumContext?.address) {
    return {
      address: premiumContext.address,
      domainName: premiumContext.domainName,
    };
  }

  // This should never happen if the component is properly wrapped in a provider
  throw new Error('useAddress must be used within an AddressPageContext or PremiumAddressPageContext');
};
