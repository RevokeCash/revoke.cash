'use client';

import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { FAIRSIDE_APP_URL } from '@revoke.cash/core/coverage/fairside';
import Button from 'components/common/Button';
import { useTranslations } from 'next-intl';

const ManageCoverageButton = () => {
  const t = useTranslations();

  return (
    <Button style="secondary" size="sm" href={FAIRSIDE_APP_URL} external className="w-fit flex items-center gap-1.5">
      {t('account.coverage.fairside.manage')}
      <ArrowTopRightOnSquareIcon className="w-4 h-4" />
    </Button>
  );
};

export default ManageCoverageButton;
