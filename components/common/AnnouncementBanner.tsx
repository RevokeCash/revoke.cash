'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';
import { useMounted } from 'lib/hooks/useMounted';
import { useTranslations } from 'next-intl';
import useLocalStorage from 'use-local-storage';

interface Props {
  storageKey: string;
  children: React.ReactNode;
}

const AnnouncementBanner = ({ storageKey, children }: Props) => {
  const t = useTranslations();
  const isMounted = useMounted();
  const [dismissed, setDismissed] = useLocalStorage<boolean>(storageKey, false);

  if (!isMounted) return null;
  if (dismissed) return null;

  return (
    <div className="w-full bg-brand text-zinc-900 dark:bg-brand dark:text-zinc-900">
      <div className="px-4 lg:px-8 py-2 flex items-center justify-between gap-3 text-sm">
        <div className="w-5" />
        <div className="flex items-center gap-2">{children}</div>
        <button
          type="button"
          aria-label={t('common.buttons.close')}
          onClick={() => setDismissed(true)}
          className="text-zinc-800 hover:text-zinc-600"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default AnnouncementBanner;
