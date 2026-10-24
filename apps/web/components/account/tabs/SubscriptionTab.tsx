'use client';

import Card, { CardTitle } from 'components/common/Card';
import { useAutoRevokeSetupNeeded } from 'lib/hooks/auto-revoke/useAutoRevokeSetupNeeded';
import { useAccountSubscriptions } from 'lib/hooks/premium/useAccountSubscriptions';
import { useTranslations } from 'next-intl';
import AutoRevokeSetupBanner from '../auto-revoke/AutoRevokeSetupBanner';
import PremiumAddressesSection from '../PremiumAddressesSection';
import SubscriptionActions from '../SubscriptionActions';
import SubscriptionOverview from '../SubscriptionOverview';

const SubscriptionTab = () => {
  const t = useTranslations();
  const { account, activeSubscription, latestExpiredSubscription, entitlements, isLoading } = useAccountSubscriptions();
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
      {setupNeeded && <AutoRevokeSetupBanner account={account!} location="account" />}
      <Card header={<CardTitle title={t('account.subscription.title')} />} className="flex flex-col gap-4">
        <SubscriptionOverview
          account={account!}
          activeSubscription={activeSubscription}
          expiredSubscription={latestExpiredSubscription}
          entitlements={entitlements}
        />
        <SubscriptionActions activeSubscription={activeSubscription} expiredSubscription={latestExpiredSubscription} />
      </Card>
      {activeSubscription && <PremiumAddressesSection activeSubscription={activeSubscription} account={account!} />}
    </div>
  );
};

export default SubscriptionTab;
