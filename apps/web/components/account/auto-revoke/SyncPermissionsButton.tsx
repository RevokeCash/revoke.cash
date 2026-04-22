'use client';

import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';

interface Props {
  onSync: () => void;
  isSyncing: boolean;
}

const SyncPermissionsButton = ({ onSync, isSyncing }: Props) => {
  const t = useTranslations();

  return (
    <button
      type="button"
      onClick={onSync}
      disabled={isSyncing}
      className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 disabled:opacity-50"
    >
      <ArrowPathIcon className={twMerge('h-3.5 w-3.5', isSyncing && 'animate-spin')} />
      {t('account.auto_revoke.permissions.sync')}
    </button>
  );
};

export default SyncPermissionsButton;
