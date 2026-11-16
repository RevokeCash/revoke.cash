'use client';

import { useAddress } from 'lib/hooks/page-context/AddressIdentityContext';
import { useViewedAddressStore } from 'lib/stores/viewed-address-store';
import { useEffect } from 'react';

/**
 * Records the viewed address page for the Crisp chat, which sends it to Crisp when the user opens the chat.
 * Must be rendered inside AddressIdentityContextProvider.
 */
const CrispViewedAddress = () => {
  const { address, domainName, isPremium, isUltimate } = useAddress();
  const setViewedAddress = useViewedAddressStore((state) => state.setViewedAddress);

  useEffect(() => {
    const premiumTier = isUltimate ? 'ultimate' : isPremium ? 'premium' : null;
    setViewedAddress({ address, domainName, premiumTier });
  }, [address, domainName, isPremium, isUltimate, setViewedAddress]);

  return null;
};

export default CrispViewedAddress;
