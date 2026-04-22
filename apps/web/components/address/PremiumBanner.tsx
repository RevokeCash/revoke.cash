'use client';

import Href from 'components/common/Href';
import { useTranslations } from 'next-intl';

const PremiumBanner = () => {
  const t = useTranslations();

  return (
    <div className="flex flex-col text-sm">
      <span>{t('address.premium.banner.description')}</span>
      <Href href="/premium" className="font-medium text-brand" underline="always" router>
        {t('address.premium.banner.cta')}
      </Href>
    </div>
  );
};

export default PremiumBanner;
