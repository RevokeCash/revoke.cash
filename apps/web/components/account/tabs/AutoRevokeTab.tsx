'use client';

import Card, { CardTitle } from 'components/common/Card';
import { useAccountSubscriptions } from 'lib/hooks/premium/useAccountSubscriptions';
import { useTranslations } from 'next-intl';
import AutoRevokeSection from '../auto-revoke/AutoRevokeSection';
import AutoRevokeUpsell from '../auto-revoke/AutoRevokeUpsell';
import AutoRevokeActivitySection from '../auto-revoke/activity/AutoRevokeActivitySection';

const AutoRevokeTab = () => {
  const t = useTranslations();
  const { account, activeUltimateSubscription, ultimateEntitlement, isLoading } = useAccountSubscriptions();

  const hasUltimate = Boolean(activeUltimateSubscription || ultimateEntitlement);

  if (isLoading) {
    return (
      <Card header={<CardTitle title={t('account.auto_revoke.title')} />} isLoading className="h-48">
        {null}
      </Card>
    );
  }

  return (
    <div className="w-full flex flex-col gap-4">
      {hasUltimate ? (
        <>
          <AutoRevokeSection activeSubscription={activeUltimateSubscription} account={account!} />
          <AutoRevokeActivitySection subscriptionId={activeUltimateSubscription?.id} />
        </>
      ) : (
        <AutoRevokeUpsell />
      )}
    </div>
  );
};

export default AutoRevokeTab;
