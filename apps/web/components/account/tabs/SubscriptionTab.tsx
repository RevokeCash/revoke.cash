'use client';

import { useAccountSubscriptions } from 'lib/hooks/premium/useAccountSubscriptions';
import PremiumAddressesSection from '../PremiumAddressesSection';
import PremiumSubscriptionSection from '../PremiumSubscriptionSection';

const SubscriptionTab = () => {
  const { account, activeSubscription, entitlements } = useAccountSubscriptions();

  return (
    <div className="flex flex-col gap-6">
      <PremiumSubscriptionSection
        account={account!}
        activeSubscription={activeSubscription}
        entitlements={entitlements}
      />
      {activeSubscription && <PremiumAddressesSection activeSubscription={activeSubscription} account={account!} />}
    </div>
  );
};

export default SubscriptionTab;
