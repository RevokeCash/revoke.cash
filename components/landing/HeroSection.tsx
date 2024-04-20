import Button from 'components/common/Button';
import { useTranslations } from 'next-intl';
import DemoVideo from './DemoVideo';
import LandingParagraph from './LandingParagraph';
import LandingSection from './LandingSection';

const HeroSection = () => {
  const t = useTranslations();

  return (
    <LandingSection title={t('landing.hero_section.title')} size="h1">
      <LandingParagraph>{t('landing.hero_section.paragraph_1')}</LandingParagraph>
      <DemoVideo />
      <Button href="/token-approval-checker/ethereum" style="primary" size="lg" className="mx-auto" router>
        {t('common.buttons.get_started')}
      </Button>
    </LandingSection>
  );
};

export default HeroSection;
