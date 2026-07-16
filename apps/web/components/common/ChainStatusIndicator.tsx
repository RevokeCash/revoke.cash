'use client';

import Button from 'components/common/Button';
import ErrorDisplay from 'components/common/ErrorDisplay';
import Spinner from 'components/common/Spinner';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

interface Props {
  status: 'loading' | 'success' | 'error';
  chainId: number;
  error: Error | null;
  isRefreshing?: boolean;
  refetch: () => void | Promise<void>;
  children: ReactNode;
}

const ChainStatusIndicator = ({ status, chainId, error, isRefreshing, refetch, children }: Props) => {
  const t = useTranslations();

  if (status === 'loading') {
    return (
      <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
        <Spinner className="w-4 h-4" />
        <span className="text-sm">{t('common.buttons.loading')}</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 min-w-0">
          {isRefreshing ? <Spinner className="w-3.5 h-3.5 shrink-0" /> : null}
          <ErrorDisplay error={error} chainId={chainId} />
        </div>
        <Button
          size="sm"
          style="secondary"
          className="shrink-0"
          loading={isRefreshing}
          onClick={(event: React.MouseEvent) => {
            event.stopPropagation();
            void refetch();
          }}
        >
          {t(isRefreshing ? 'common.buttons.retrying' : 'common.buttons.try_again')}
        </Button>
      </div>
    );
  }

  return <>{children}</>;
};

export default ChainStatusIndicator;
