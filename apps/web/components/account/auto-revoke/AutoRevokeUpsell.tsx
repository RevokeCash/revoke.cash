'use client';

import Button from 'components/common/Button';
import Card, { CardTitle } from 'components/common/Card';
import { useTranslations } from 'next-intl';

const AutoRevokeUpsell = () => {
  const t = useTranslations();

  return (
    <Card header={<CardTitle title={t('account.auto_revoke.title')} />} className="flex flex-col items-start gap-4">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{t('account.auto_revoke.upsell')}</p>
      <Button style="primary" size="md" href="/premium" router>
        {t('common.buttons.upgrade_to_premium')}
      </Button>
    </Card>
  );
};

export default AutoRevokeUpsell;
