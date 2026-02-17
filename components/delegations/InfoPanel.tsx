'use client';

import Card from 'components/common/Card';
import RichText from 'components/common/RichText';
import { useTranslations } from 'next-intl';

const InfoPanel = () => {
  const t = useTranslations();

  return (
    <Card title={t('address.delegations.info_panel.title')}>
      <p>
        <RichText>{(tags) => t.rich('address.delegations.info_panel.description', tags)}</RichText>
      </p>
    </Card>
  );
};

export default InfoPanel;
