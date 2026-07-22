'use client';

import Card, { CardTitle } from 'components/common/Card';
import { useAccountSubscriptions } from 'lib/hooks/premium/useAccountSubscriptions';
import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';
import AutoRevokeSection from '../auto-revoke/AutoRevokeSection';
import AutoRevokeUpsellBanner from '../auto-revoke/AutoRevokeUpsellBanner';
import AutoRevokeActivitySection from '../auto-revoke/activity/AutoRevokeActivitySection';

const AutoRevokeTab = () => {
  const t = useTranslations();
  const { account, activeUltimateSubscription, ultimateEntitlement, isLoading } = useAccountSubscriptions();

  const hasUltimate = Boolean(activeUltimateSubscription || ultimateEntitlement);
  const isPreview = !hasUltimate;

  if (isLoading) {
    return (
      <Card header={<CardTitle title={t('account.auto_revoke.title')} />} isLoading className="h-48">
        {null}
      </Card>
    );
  }

  return (
    <div className="w-full flex flex-col gap-4">
      {isPreview && <AutoRevokeUpsellBanner />}
      <div inert={isPreview} className={twMerge('flex flex-col gap-4', isPreview && 'opacity-60')}>
        <AutoRevokeSection activeSubscription={activeUltimateSubscription} account={account!} isPreview={isPreview} />
        <AutoRevokeActivitySection
          subscriptionId={activeUltimateSubscription?.id}
          addressCount={activeUltimateSubscription?.addresses.length}
          isPreview={isPreview}
        />
      </div>
    </div>
  );
};

export default AutoRevokeTab;
