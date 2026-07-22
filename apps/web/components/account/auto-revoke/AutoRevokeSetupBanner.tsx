'use client';

import Button from 'components/common/Button';
import Href from 'components/common/Href';
import NoticeBanner from 'components/common/NoticeBanner';
import { useTranslations } from 'next-intl';

const AutoRevokeSetupBanner = () => {
  const t = useTranslations();

  return (
    <NoticeBanner
      style="info"
      action={
        <div className="flex items-center gap-4">
          <Href href="/premium/automated-revoking" router underline="always" className="text-sm">
            {t('common.buttons.learn_more')}
          </Href>
          <Button style="secondary" size="sm" href="/account/auto-revoke" router>
            {t('account.auto_revoke.setup.banner_cta')}
          </Button>
        </div>
      }
    >
      {t('account.auto_revoke.setup.banner')}
    </NoticeBanner>
  );
};

export default AutoRevokeSetupBanner;
