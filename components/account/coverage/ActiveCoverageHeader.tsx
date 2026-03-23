'use client';

import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import Label from 'components/common/Label';
import { formatDate } from 'lib/utils/time';
import { useTranslations } from 'next-intl';

interface ActiveCoverageHeaderProps {
  coverAmount: number;
  validUntil: string;
}

const ActiveCoverageHeader = ({ coverAmount, validUntil }: ActiveCoverageHeaderProps) => {
  const t = useTranslations();

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <ShieldCheckIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
        <span className="font-medium">{t('account.coverage.active')}</span>
        <Label className="bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100">
          {t('account.coverage.covered', { amount: `${coverAmount} ETH` })}
        </Label>
      </div>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {t('account.coverage.valid_until', { date: formatDate(validUntil) })}
      </p>
    </div>
  );
};

export default ActiveCoverageHeader;
