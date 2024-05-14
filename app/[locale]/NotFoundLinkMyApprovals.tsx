'use client';

import { UserCircleIcon } from '@heroicons/react/24/outline';
import NotFoundLink from 'components/common/NotFoundLink';
import { useMounted } from 'lib/hooks/useMounted';
import { useTranslations } from 'next-intl';
import { useAccount } from 'wagmi';

const NotFoundLinkMyApprovals = () => {
  const t = useTranslations();
  const { address: account } = useAccount();
  const isMounted = useMounted();

  if (!isMounted || !account) return null;

  return (
    <NotFoundLink
      title={t('common.errors.404.suggested_pages.your_allowances.title')}
      href={`/address/${account}`}
      description={t('common.errors.404.suggested_pages.your_allowances.description')}
      icon={<UserCircleIcon className="h-6 w-6" />}
    />
  );
};

export default NotFoundLinkMyApprovals;
