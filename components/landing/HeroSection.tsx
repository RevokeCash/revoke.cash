import Button from 'components/common/Button';
import useTranslation from 'next-translate/useTranslation';
import DemoVideo from './DemoVideo';
import LandingParagraph from './LandingParagraph';
import LandingSection from './LandingSection';

const HeroSection = () => {
  const { t } = useTranslation();

  return (
    <LandingSection title={t('landing:hero_section.title')} size="h1">
      <LandingParagraph>{t('landing:hero_section.paragraph_1')}</LandingParagraph>
      <DemoVideo />
      <Button href="/token-approval-checker/ethereum" style="primary" size="lg" className="mx-auto" router>
        {t('common:buttons.get_started')}
      </Button>
    </LandingSection>
  );
};

export default HeroSection;
