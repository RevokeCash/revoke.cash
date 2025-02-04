import Card from 'components/common/Card';
import { useTranslations } from 'next-intl';

const CoverageInfo = () => {
  const t = useTranslations('address.coverage.info');

  return (
    <div className="flex flex-col md:flex-row gap-4 md:w-[75%]">
      <Card className="">
        <div className="flex flex-col gap-2">
          <h3 className="font-bold text-lg">{t('what.title')}</h3>
          <p>{t('what.description')}</p>
        </div>
      </Card>
      <Card className="">
        <div className="flex flex-col gap-2">
          <h3 className="font-bold text-lg">{t('how.title')}</h3>
          <p>{t('how.description')}</p>
        </div>
      </Card>
    </div>
  );
};

export default CoverageInfo;
