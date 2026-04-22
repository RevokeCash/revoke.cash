'use client';

import { useAddress } from 'lib/hooks/page-context/AddressIdentityContext';
import HistoryDashboard from './HistoryDashboard';

const HistoryPageContent = () => {
  const { isPremium } = useAddress();
  return <HistoryDashboard isPremium={isPremium} />;
};

export default HistoryPageContent;
