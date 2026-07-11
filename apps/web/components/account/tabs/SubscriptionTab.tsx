'use client';

import Card, { CardTitle } from 'components/common/Card';
import { useAutoRevokeSetupNeeded } from 'lib/hooks/auto-revoke/useAutoRevokeSetupNeeded';
import { useAccountSubscriptions } from 'lib/hooks/premium/useAccountSubscriptions';
import { useTranslations } from 'next-intl';
import AutoRevokeSetupBanner from '../auto-revoke/AutoRevokeSetupBanner';
import PremiumAddressesSection from '../PremiumAddressesSection';
import PremiumSubscriptionSection from '../PremiumSubscriptionSection';

const SubscriptionTab = () => {
  const t = useTranslations();
  const { account, activeSubscription, entitlements, isLoading } = useAccountSubscriptions();
  const { setupNeeded } = useAutoRevokeSetupNeeded();

  if (isLoading) {
    return (
      <Card header={<CardTitle title={t('account.subscription.title')} />} isLoading className="h-48">
        {null}
      </Card>
    );
  }

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
