'use client';

import { useAccountSubscriptions } from 'lib/hooks/premium/useAccountSubscriptions';
import CoverageSection from '../coverage/CoverageSection';

const CoverageTab = () => {
  const { account } = useAccountSubscriptions();

  return <CoverageSection account={account!} />;
};

export default CoverageTab;
