'use client';

import NoticeBanner from 'components/common/NoticeBanner';
import { useTranslations } from 'next-intl';

const MetaMaskRequiredBanner = () => {
  const t = useTranslations();

  return <NoticeBanner style="warning">{t('account.auto_revoke.metamask_required')}</NoticeBanner>;
};

export default MetaMaskRequiredBanner;
