import Card from 'components/common/Card';
import RichText from 'components/common/RichText';
import { useTranslations } from 'next-intl';

const InfoPanel = () => {
  const t = useTranslations();

  return (
    <Card title={t('address.coverage.info.title')}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <p>
          <RichText>{(tags) => t.rich('address.coverage.info.description', tags)}</RichText>
        </p>
      </div>
    </Card>
  );
};

export default InfoPanel;
