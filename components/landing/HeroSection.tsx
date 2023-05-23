import ConnectButton from 'components/header/ConnectButton';
import useTranslation from 'next-translate/useTranslation';
import { useRouter } from 'next/router';
import DemoVideo from './DemoVideo';
import LandingParagraph from './LandingParagraph';
import LandingSection from './LandingSection';

const HeroSection = () => {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <LandingSection title={t('landing:hero_section.title')} size="h1">
      <LandingParagraph>{t('landing:hero_section.paragraph_1')}</LandingParagraph>
      <DemoVideo />
      <ConnectButton style="primary" size="lg" className="font-bold mx-auto" text={t('common:buttons.get_started')} />
    </LandingSection>
  );
};

export default HeroSection;
