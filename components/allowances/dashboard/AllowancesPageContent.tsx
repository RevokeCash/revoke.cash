'use client';

import { useAddress } from 'lib/hooks/page-context/AddressIdentityContext';
import AllowanceDashboard from './AllowanceDashboard';
import PremiumAllowanceDashboard from './PremiumAllowanceDashboard';

const AllowancesPageContent = () => {
  const { isPremium } = useAddress();
  return isPremium ? <PremiumAllowanceDashboard /> : <AllowanceDashboard />;
};

export default AllowancesPageContent;
