'use client';

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useTranslations } from 'next-intl';

const MetaMaskRequiredBanner = () => {
  const t = useTranslations();

  return (
    <div className="rounded-lg border border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20 p-4 flex items-center gap-3">
      <ExclamationTriangleIcon className="h-6 w-6 shrink-0 text-yellow-500" />
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{t('account.auto_revoke.metamask_required')}</p>
    </div>
  );
};

export default MetaMaskRequiredBanner;
