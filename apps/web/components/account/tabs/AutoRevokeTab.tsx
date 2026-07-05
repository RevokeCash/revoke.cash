'use client';

import Button from 'components/common/Button';
import Card, { CardTitle } from 'components/common/Card';
import { useAccountSubscriptions } from 'lib/hooks/premium/useAccountSubscriptions';
import { useTranslations } from 'next-intl';
import AutoRevokeSection from '../auto-revoke/AutoRevokeSection';

const AutoRevokeTab = () => {
  const t = useTranslations();
  const { account, activeUltimateSubscription, ultimateEntitlement } = useAccountSubscriptions();

  if (!activeUltimateSubscription && !ultimateEntitlement) {
    return (
      <Card header={<CardTitle title={t('account.auto_revoke.title')} />} className="flex flex-col items-start gap-4">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{t('account.auto_revoke.upsell')}</p>
        <Button style="primary" size="md" href="/premium" router>
          {t('common.buttons.upgrade_to_premium')}
        </Button>
      </Card>
    );
  }

  return <AutoRevokeSection activeSubscription={activeUltimateSubscription} account={account!} />;
};

export default AutoRevokeTab;
