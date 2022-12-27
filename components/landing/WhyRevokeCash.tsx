import Trans from 'next-translate/Trans';
import useTranslation from 'next-translate/useTranslation';
import LandingParagraph from './LandingParagraph';

const WhyRevokeCash = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-8 w-full max-w-3xl px-8">
      <h2 className="text-3xl md:text-4xl text-center">{t('landing:why_revoke.title')}</h2>
      <div className="flex flex-col gap-4">
        <LandingParagraph title={t('landing:why_revoke.paragraph_1.title')}>
          <Trans i18nKey="landing:why_revoke.paragraph_1.description" />
        </LandingParagraph>
        <LandingParagraph title={t('landing:why_revoke.paragraph_2.title')}>
          <Trans i18nKey="landing:why_revoke.paragraph_2.description" components={[<span className="italic" />]} />
        </LandingParagraph>
        <LandingParagraph title={t('landing:why_revoke.paragraph_3.title')}>
          <Trans i18nKey="landing:why_revoke.paragraph_3.description" />
        </LandingParagraph>
      </div>
    </div>
  );
};

export default WhyRevokeCash;
