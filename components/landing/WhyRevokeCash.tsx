import { useTranslations } from 'next-intl';
import LandingParagraph from './LandingParagraph';
import LandingSection from './LandingSection';

const WhyRevokeCash = () => {
  const t = useTranslations();

  return (
    <LandingSection title={t('landing.why_revoke.title')} size="h2">
      <LandingParagraph title={t('landing.why_revoke.paragraph_1.title')}>
        {t('landing.why_revoke.paragraph_1.description')}
      </LandingParagraph>
      <LandingParagraph title={t('landing.why_revoke.paragraph_2.title')}>
        {t.rich('landing.why_revoke.paragraph_2.description')}
      </LandingParagraph>
      <LandingParagraph title={t('landing.why_revoke.paragraph_3.title')}>
        {t('landing.why_revoke.paragraph_3.description')}
      </LandingParagraph>
    </LandingSection>
  );
};

export default WhyRevokeCash;
