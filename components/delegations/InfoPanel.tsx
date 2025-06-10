'use client';

import Card from 'components/common/Card';
import { useTranslations } from 'next-intl';

const InfoPanel = () => {
  const t = useTranslations();

  return (
    <Card title={t('address.delegations.info_panel.title')}>
      <p>{t.rich('address.delegations.info_panel.description')}</p>
    </Card>
  );
};

export default InfoPanel;
