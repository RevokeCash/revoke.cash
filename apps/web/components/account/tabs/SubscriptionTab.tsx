'use client';

import { useAutoRevokeSetupNeeded } from 'lib/hooks/auto-revoke/useAutoRevokeSetupNeeded';
import { useAccountSubscriptions } from 'lib/hooks/premium/useAccountSubscriptions';
import AutoRevokeSetupBanner from '../auto-revoke/AutoRevokeSetupBanner';
import PremiumAddressesSection from '../PremiumAddressesSection';
import PremiumSubscriptionSection from '../PremiumSubscriptionSection';

const SubscriptionTab = () => {
  const { account, activeSubscription, entitlements } = useAccountSubscriptions();
  const { setupNeeded } = useAutoRevokeSetupNeeded();

  return (
    <div className="w-full flex flex-col gap-4">
      {setupNeeded && <AutoRevokeSetupBanner />}
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
