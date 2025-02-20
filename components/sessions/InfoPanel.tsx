import Card from 'components/common/Card';
import { useTranslations } from 'next-intl';

const InfoPanel = () => {
  const t = useTranslations();

  return (
    <Card title={t('address.sessions.info.title')}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <p>{t.rich('address.sessions.info.description')}</p>
      </div>
    </Card>
  );
};

export default InfoPanel;
