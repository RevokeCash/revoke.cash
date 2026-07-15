'use client';

import { SparklesIcon } from '@heroicons/react/24/solid';
import Button from 'components/common/Button';
import { useTranslations } from 'next-intl';

const AutoRevokeUpsellBanner = () => {
  const t = useTranslations();

  return (
    <div className="rounded-lg border border-brand/50 bg-brand/5 p-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <SparklesIcon className="h-6 w-6 shrink-0 text-brand" />
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{t('account.auto_revoke.upsell')}</p>
      </div>
      <Button style="primary" size="sm" href="/account?plan=ultimate" router>
        {t('common.buttons.upgrade_to_ultimate')}
      </Button>
    </div>
  );
};

export default AutoRevokeUpsellBanner;
