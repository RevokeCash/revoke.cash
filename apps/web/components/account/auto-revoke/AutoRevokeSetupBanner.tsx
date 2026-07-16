'use client';

import { InformationCircleIcon } from '@heroicons/react/24/outline';
import Button from 'components/common/Button';
import { useTranslations } from 'next-intl';

const AutoRevokeSetupBanner = () => {
  const t = useTranslations();

  return (
    <div className="rounded-lg border border-brand/50 bg-brand/5 p-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <InformationCircleIcon className="h-6 w-6 shrink-0 text-brand" />
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{t('account.auto_revoke.setup.banner')}</p>
      </div>
      <Button style="secondary" size="sm" href="/account/auto-revoke" router>
        {t('account.auto_revoke.setup.banner_cta')}
      </Button>
    </div>
  );
};

export default AutoRevokeSetupBanner;
