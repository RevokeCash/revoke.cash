'use client';

import { ShieldCheckIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';
import { formatDate } from '@revoke.cash/core/utils/time';
import StatusLabel from 'components/common/StatusLabel';
import { useTranslations } from 'next-intl';

interface Props {
  isActive: boolean;
  coverAmount?: number | null;
  validUntil?: string | null;
}

const CoverageHeader = ({ isActive, coverAmount, validUntil }: Props) => {
  const t = useTranslations();

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          {isActive ? (
            <ShieldCheckIcon className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
          ) : (
            <ShieldExclamationIcon className="h-5 w-5 shrink-0 text-zinc-500 dark:text-zinc-400" />
          )}
          <span className="font-medium">{t('account.coverage.fairside.title')}</span>
        </div>
        <div className="flex items-center gap-2">
          {isActive ? (
            <>
              <StatusLabel status="success">{t('account.coverage.active')}</StatusLabel>
              <StatusLabel status="success">
                {t('account.coverage.fairside.covered', { amount: `${coverAmount} ETH` })}
              </StatusLabel>
            </>
          ) : (
            <StatusLabel status="neutral">{t('account.coverage.inactive')}</StatusLabel>
          )}
        </div>
      </div>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {isActive
          ? `${t('account.coverage.fairside.active_description', { amount: `${coverAmount} ETH` })} ${t('account.coverage.fairside.valid_until', { date: formatDate(validUntil!) })}`
          : t('account.coverage.fairside.description')}
      </p>
    </div>
  );
};

export default CoverageHeader;
