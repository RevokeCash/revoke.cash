import Trans from 'next-translate/Trans';
import useTranslation from 'next-translate/useTranslation';
import LandingParagraph from './LandingParagraph';
import LandingSection from './LandingSection';

const WhyRevokeCash = () => {
  const { t } = useTranslation();

  return (
    <LandingSection title={t('landing:why_revoke.title')} size="md">
      <LandingParagraph title={t('landing:why_revoke.paragraph_1.title')}>
        <Trans i18nKey="landing:why_revoke.paragraph_1.description" />
      </LandingParagraph>
      <LandingParagraph title={t('landing:why_revoke.paragraph_2.title')}>
        <Trans i18nKey="landing:why_revoke.paragraph_2.description" components={[<span className="italic" />]} />
      </LandingParagraph>
      <LandingParagraph title={t('landing:why_revoke.paragraph_3.title')}>
        <Trans i18nKey="landing:why_revoke.paragraph_3.description" />
      </LandingParagraph>
    </LandingSection>
  );
};

export default WhyRevokeCash;
