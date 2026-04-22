'use client';

import { ChainId } from '@revoke.cash/chains';
import { useAddress } from 'lib/hooks/page-context/AddressIdentityContext';
import SessionsDashboard from './SessionsDashboard';

const SessionsPageContent = () => {
  const { isPremium } = useAddress();
  return <SessionsDashboard chainId={isPremium ? ChainId.Abstract : undefined} />;
};

export default SessionsPageContent;
