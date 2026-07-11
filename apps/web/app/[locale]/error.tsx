'use client';

import { parseErrorMessage } from '@revoke.cash/core/utils/errors';
import Button from 'components/common/Button';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';

// Catches rendering errors from every page segment (an explicit error beats silently rendering the
// wrong experience). Errors in the locale layout itself still fall through to global-error.
const PageError = ({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) => {
  const t = useTranslations();
  const router = useRouter();
  const [isRetrying, startTransition] = useTransition();

  // reset() alone only re-renders client state; the refresh re-runs the failed server render
  const retry = () => {
    startTransition(() => {
      router.refresh();
      reset();
    });
  };

  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <p className="text-lg">{t('common.errors.messages.page_load_failed')}</p>
      <Button style="primary" size="md" onClick={retry} loading={isRetrying}>
        {t('common.buttons.try_again')}
      </Button>
      <p className="max-w-xl text-sm font-mono break-all text-zinc-500 dark:text-zinc-400">
        {error.digest ?? parseErrorMessage(error)}
      </p>
    </div>
  );
};

export default PageError;
