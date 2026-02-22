'use client';

import Button from 'components/common/Button';
import ChainLogo from 'components/common/ChainLogo';
import ErrorDisplay from 'components/common/ErrorDisplay';
import Spinner from 'components/common/Spinner';
import type { ChainAllowanceData, ChainLoadingStatus } from 'lib/hooks/page-context/PremiumAddressPageContext';
import { getChainName } from 'lib/utils/chains';
import { formatFiatAmount } from 'lib/utils/formatting';
import { useTranslations } from 'next-intl';

interface Props {
  chainData: ChainAllowanceData;
}

const ChainSectionHeader = ({ chainData }: Props) => {
  const { chainId, status, error, allowances, totalValueAtRisk, refetch } = chainData;
  const chainName = getChainName(chainId);
  const formattedValue = formatFiatAmount(totalValueAtRisk);

  return (
    <div className="w-full flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0 shrink-0">
        <ChainLogo chainId={chainId} size={28} />
        <span className="font-medium text-base truncate">{chainName}</span>
      </div>
      <div className="flex items-center gap-4 min-w-0">
        <StatusIndicator
          status={status}
          chainId={chainId}
          allowanceCount={allowances.length}
          formattedValue={formattedValue}
          error={error}
          refetch={refetch}
        />
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
  return formattedValue !== '$0.00' && !formattedValue.startsWith('<');
};

export default ChainSectionHeader;
