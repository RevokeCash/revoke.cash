'use client';

import { SparklesIcon } from '@heroicons/react/24/solid';
import Button from 'components/common/Button';
import NoticeBanner from 'components/common/NoticeBanner';
import { useTranslations } from 'next-intl';

const AutoRevokeUpsellBanner = () => {
  const t = useTranslations();

  return (
    <NoticeBanner
      style="info"
      icon={SparklesIcon}
      action={
        <Button style="primary" size="sm" href="/account?plan=ultimate" router>
          {t('common.buttons.upgrade_to_ultimate')}
        </Button>
      }
    >
      {t('account.auto_revoke.upsell')}
    </NoticeBanner>
  );
};

export default AutoRevokeUpsellBanner;
