'use client';

import { useAccountSubscriptions } from 'lib/hooks/premium/useAccountSubscriptions';
import BillingSection from '../BillingSection';

const BillingTab = () => {
  const { subscriptions, isLoading } = useAccountSubscriptions();

  return <BillingSection subscriptions={subscriptions} isLoading={isLoading} />;
};

export default BillingTab;
