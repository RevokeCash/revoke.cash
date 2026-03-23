'use client';

import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import Button from 'components/common/Button';
import { FAIRSIDE_APP_URL } from 'lib/coverage/fairside';
import { useTranslations } from 'next-intl';

const ManageCoverageButton = () => {
  const t = useTranslations();

  return (
    <Button style="secondary" size="sm" href={FAIRSIDE_APP_URL} external className="w-fit flex items-center gap-1.5">
      {t('account.coverage.manage')}
      <ArrowTopRightOnSquareIcon className="w-4 h-4" />
    </Button>
  );
};

export default ManageCoverageButton;
