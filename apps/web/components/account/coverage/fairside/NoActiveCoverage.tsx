'use client';

import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { FAIRSIDE_LANDING_URL } from '@revoke.cash/core/coverage/fairside';
import Button from 'components/common/Button';
import { useTranslations } from 'next-intl';

const NoActiveCoverage = () => {
  const t = useTranslations();

  return (
    <Button
      style="secondary"
      size="sm"
      href={FAIRSIDE_LANDING_URL}
      external
      className="w-fit flex items-center gap-1.5"
    >
      {t('account.coverage.fairside.get_coverage')}
      <ArrowTopRightOnSquareIcon className="w-4 h-4" />
    </Button>
  );
};

export default NoActiveCoverage;
