'use client';

import { useAccountSubscriptions } from 'lib/hooks/premium/useAccountSubscriptions';
import PremiumAddressesSection from '../PremiumAddressesSection';
import PremiumSubscriptionSection from '../PremiumSubscriptionSection';

const SubscriptionTab = () => {
  const { account, activeSubscription, entitlements } = useAccountSubscriptions();

  return (
    <div className="w-full flex flex-col gap-4">
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
