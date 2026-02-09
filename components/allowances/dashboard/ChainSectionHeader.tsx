'use client';

import Button from 'components/common/Button';
import ChainLogo from 'components/common/ChainLogo';
import Chevron from 'components/common/Chevron';
import ErrorDisplay from 'components/common/ErrorDisplay';
import Spinner from 'components/common/Spinner';
import type { ChainAllowanceData, ChainLoadingStatus } from 'lib/hooks/page-context/PremiumAddressPageContext';
import { getChainName } from 'lib/utils/chains';
import { formatFiatAmount } from 'lib/utils/formatting';
import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';

interface Props {
  chainData: ChainAllowanceData;
  isExpanded: boolean;
  canExpand: boolean;
  onToggle: () => void;
}

const ChainSectionHeader = ({ chainData, isExpanded, canExpand, onToggle }: Props) => {
  const { chainId, status, error, allowances, totalValueAtRisk, refetch } = chainData;

  const chainName = getChainName(chainId);
  const allowanceCount = allowances.length;
  const formattedValue = formatFiatAmount(totalValueAtRisk);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (canExpand && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onToggle();
    }
  };

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: Can't use <button> because StatusIndicator contains a nested button for retry
    <div
      role={canExpand ? 'button' : undefined}
      tabIndex={canExpand ? 0 : undefined}
      onClick={canExpand ? onToggle : undefined}
      onKeyDown={canExpand ? onKeyDown : undefined}
      className={twMerge(
        'w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg border transition-colors',
        canExpand && 'cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50',
        status === 'error'
          ? 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/10'
          : 'border-black dark:border-white bg-white dark:bg-zinc-900',
        isExpanded && 'rounded-b-none border-b-0',
      )}
    >
      {/* Left side: Chain info */}
      <div className="flex items-center gap-3 min-w-0 shrink-0">
        <ChainLogo chainId={chainId} size={28} />
        <span className="font-medium text-base truncate">{chainName}</span>
      </div>

      {/* Right side: Status indicators */}
      <div className="flex items-center gap-4 min-w-0">
        <StatusIndicator
          status={status}
          chainId={chainId}
          allowanceCount={allowanceCount}
          formattedValue={formattedValue}
          error={error}
          refetch={refetch}
        />

        {canExpand && (
          <Chevron
            className={twMerge(
              'w-5 h-5 transition-transform fill-zinc-400 dark:fill-zinc-500 shrink-0',
              isExpanded && 'rotate-180',
            )}
          />
        )}
      </div>
    </div>
  );
};

interface StatusIndicatorProps {
  status: ChainLoadingStatus;
  chainId: number;
  allowanceCount: number;
  formattedValue: string | null;
  error: Error | null;
  refetch: () => void;
}

const StatusIndicator = ({ status, chainId, allowanceCount, formattedValue, error, refetch }: StatusIndicatorProps) => {
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
        <div className="text-sm text-red-600 dark:text-red-400 min-w-0">
          <ErrorDisplay error={error} chainId={chainId} />
        </div>
        <Button
          size="sm"
          style="secondary"
          className="shrink-0"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            refetch();
          }}
        >
          {t('common.buttons.try_again')}
        </Button>
      </div>
    );
  }

  // Success state
  if (allowanceCount === 0) {
    return <span className="text-sm text-zinc-500 dark:text-zinc-400">{t('address.allowances.none_found')}</span>;
  }

  return (
    <div className="flex items-center gap-4 text-sm">
      <span className="text-zinc-700 dark:text-zinc-300">
        {allowanceCount} {allowanceCount === 1 ? 'approval' : 'approvals'}
      </span>
      {formattedValue && totalValueAtRiskIsSignificant(formattedValue) && (
        <span className="text-amber-600 dark:text-amber-400 font-medium">{formattedValue}</span>
      )}
    </div>
  );
};

const totalValueAtRiskIsSignificant = (formattedValue: string | null): boolean => {
  if (!formattedValue) return false;
  // Don't show if it's "$0.00" or "< $0.01"
  return formattedValue !== '$0.00' && !formattedValue.startsWith('<');
};

export default ChainSectionHeader;
