'use client';

import Button from 'components/common/Button';
import ChainDisplay from 'components/common/ChainDisplay';
import ChainLogoStack from 'components/common/ChainLogoStack';
import CollapsibleCard from 'components/common/CollapsibleCard';
import ErrorDisplay from 'components/common/ErrorDisplay';
import Spinner from 'components/common/Spinner';
import type { ChainLoadingStatus } from 'lib/hooks/page-context/PremiumAddressPageContext';
import { useTranslations } from 'next-intl';
import { type KeyboardEvent, type MouseEvent, useState } from 'react';
import { twMerge } from 'tailwind-merge';

export interface ChainStatus {
  chainId: number;
  status: ChainLoadingStatus;
  error: Error | null;
  isRefreshing?: boolean;
  refetch: () => void;
}

interface Props {
  chainStatuses: ChainStatus[];
}

const PremiumChainStatusSection = ({ chainStatuses }: Props) => {
  const t = useTranslations();
  const [showDetails, setShowDetails] = useState(false);

  const failedChains = chainStatuses.filter((chain) => chain.status === 'error');
  const loadingChains = chainStatuses.filter((chain) => chain.status === 'loading');
  const loadedChains = chainStatuses.filter((chain) => chain.status === 'success');
  const isRetryingFailedChains = failedChains.some((chain) => chain.isRefreshing);
  const retryButtonText = t(isRetryingFailedChains ? 'common.buttons.retrying' : 'common.buttons.try_again');

  const showChainStatus = loadingChains.length > 0 || failedChains.length > 0;

  const refetchFailedChains = () => {
    if (failedChains.length === 0) return;
    for (const chain of failedChains) {
      chain.refetch();
    }
  };

  if (!showChainStatus) return null;

  return (
    <CollapsibleCard
      isExpanded={showDetails}
      onToggle={() => setShowDetails((value) => !value)}
      className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black"
      headerClassName="px-4 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
      contentClassName="px-4 pb-3 border-zinc-200 dark:border-zinc-800"
      header={
        <div className="w-full flex items-center justify-between gap-3">
          <div className="flex items-center flex-wrap gap-2 text-sm min-w-0">
            <StatusPill
              label={t('address.history.status_loaded')}
              status="loaded"
              chainIds={loadedChains.map((chain) => chain.chainId)}
            />
            <StatusPill
              label={t('address.history.status_loading')}
              status="loading"
              chainIds={loadingChains.map((chain) => chain.chainId)}
            />
            <StatusPill
              label={t('address.history.status_failed')}
              status="failed"
              chainIds={failedChains.map((chain) => chain.chainId)}
            />
          </div>
          {failedChains.length > 0 && loadingChains.length === 0 ? (
            <Button
              size="sm"
              style="secondary"
              className="shrink-0"
              loading={isRetryingFailedChains}
              onKeyDown={(event: KeyboardEvent) => event.stopPropagation()}
              onClick={(event: MouseEvent) => {
                event.stopPropagation();
                refetchFailedChains();
              }}
            >
              {retryButtonText} ({failedChains.length})
            </Button>
          ) : null}
        </div>
      }
    >
      <div className="flex flex-col gap-2 pt-3">
        {failedChains.map((chain) => (
          <div
            key={chain.chainId}
            className="flex items-center gap-2 min-w-0 text-sm rounded-sm px-3 py-2 bg-red-100 dark:bg-red-900/25"
          >
            <ChainDisplay chainId={chain.chainId} logoSize={18} className="w-42" />
            {chain.isRefreshing ? <Spinner className="w-3.5 h-3.5 shrink-0" /> : null}
            <ErrorDisplay chainId={chain.chainId} error={chain.error} />
          </div>
        ))}
        {loadingChains.map((chain) => (
          <div
            key={chain.chainId}
            className="flex items-center gap-2 min-w-0 text-sm rounded-sm px-3 py-2 bg-zinc-100/80 dark:bg-zinc-800/50"
          >
            <ChainDisplay chainId={chain.chainId} logoSize={18} className="w-42" />
            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
              <Spinner className="w-3.5 h-3.5 shrink-0" />
              <span className="min-w-0 truncate">{t('common.buttons.loading')}</span>
            </div>
          </div>
        ))}
      </div>
    </CollapsibleCard>
  );
};

interface StatusPillProps {
  label: string;
  status: 'loaded' | 'loading' | 'failed';
  chainIds: number[];
}

const StatusPill = ({ label, status, chainIds }: StatusPillProps) => {
  const count = chainIds.length;

  const statusClasses = {
    loaded:
      'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
    loading: 'border-zinc-300 bg-zinc-100 text-zinc-800 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200',
    failed: 'border-red-400 bg-red-100 text-red-900 dark:border-red-700 dark:bg-red-900/30 dark:text-red-200',
  } as const;

  const overflowClasses = {
    loaded: 'bg-emerald-200 dark:bg-emerald-800/80',
    loading: 'bg-zinc-200 dark:bg-zinc-700',
    failed: 'bg-red-200 dark:bg-red-800/80',
  } as const;

  if (count === 0) return null;

  return (
    <span
      className={twMerge(
        'inline-flex items-center gap-2 rounded-full border px-2 py-1 text-xs font-medium',
        statusClasses[status],
      )}
    >
      <span className="hidden sm:inline-flex">
        <ChainLogoStack
          chainIds={chainIds}
          maxVisible={3}
          logoSize={20}
          overlapClassName="-space-x-2.5"
          overflowClassName={overflowClasses[status]}
        />
      </span>
      <span>
        <span className="font-semibold">{count}</span> {label}
      </span>
    </span>
  );
};

export default PremiumChainStatusSection;
