'use client';

import { useAddress } from 'lib/hooks/page-context/AddressIdentityContext';
import DelegationsDashboard from './DelegationsDashboard';
import PremiumDelegationsDashboard from './PremiumDelegationsDashboard';

const DelegationsPageContent = () => {
  const { isPremium } = useAddress();
  return isPremium ? <PremiumDelegationsDashboard /> : <DelegationsDashboard />;
};

export default DelegationsPageContent;
