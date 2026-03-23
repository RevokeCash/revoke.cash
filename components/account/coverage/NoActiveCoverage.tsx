'use client';

import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import Button from 'components/common/Button';
import { FAIRSIDE_LANDING_URL } from 'lib/coverage/fairside';
import { useTranslations } from 'next-intl';

const NoActiveCoverage = () => {
  const t = useTranslations();

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{t('account.coverage.description')}</p>
      <Button
        style="secondary"
        size="sm"
        href={FAIRSIDE_LANDING_URL}
        external
        className="w-fit flex items-center gap-1.5"
      >
        {t('account.coverage.get_coverage')}
        <ArrowTopRightOnSquareIcon className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default NoActiveCoverage;
