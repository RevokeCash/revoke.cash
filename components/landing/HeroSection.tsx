import Button from 'components/common/Button';
import { useEthereum } from 'lib/hooks/useEthereum';
import useTranslation from 'next-translate/useTranslation';
import { useRouter } from 'next/router';
import LandingParagraph from './LandingParagraph';
import LandingSection from './LandingSection';

const HeroSection = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { connect } = useEthereum();

  const connectAndRedirect = async () => {
    const address = await connect();
    if (address) {
      router.push(`/address/${address}`);
    }
  };

  return (
    <LandingSection title={t('landing:hero_section.title')} size="lg">
      <LandingParagraph>{t('landing:hero_section.paragraph_1')}</LandingParagraph>
      <div className="h-96 border border-black w-full max-w-5xl">TODO: add demo video here</div>
      <Button style="primary" size="lg" className="font-bold mx-auto" onClick={connectAndRedirect}>
        {t('common:buttons.get_started')}
      </Button>
    </LandingSection>
  );
};

export default HeroSection;
