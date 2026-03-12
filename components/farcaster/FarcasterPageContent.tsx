'use client';

import farcasterSdk from '@farcaster/miniapp-sdk';
import { AddressPageContextProvider } from 'lib/hooks/page-context/AddressPageContext';
import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import FarcasterDashboard from './FarcasterDashboard';

const FarcasterPageContent = () => {
  const { address } = useAccount();

  useEffect(() => {
    farcasterSdk.actions.ready();
  }, []);

  // If no address is connected, show the dashboard without context (it will show connect button)
  if (!address) {
    return <FarcasterDashboard hasContext={false} />;
  }

  // If address is connected, wrap in AddressPageContextProvider
  return (
    <AddressPageContextProvider address={address}>
      <FarcasterDashboard hasContext={true} />
    </AddressPageContextProvider>
  );
};

export default FarcasterPageContent;
