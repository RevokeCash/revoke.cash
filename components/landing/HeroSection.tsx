import Button from 'components/common/Button';
import { useEthereum } from 'lib/hooks/useEthereum';
import useTranslation from 'next-translate/useTranslation';
import { useRouter } from 'next/router';
import LandingParagraph from './LandingParagraph';

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
    <div className="flex flex-col gap-4 max-w-3xl px-4">
      <div className="flex flex-col gap-2 mb-2">
        <h2 className="text-4xl md:text-5xl text-center">{t('landing:hero_section.title')}</h2>
        <LandingParagraph>{t('landing:hero_section.paragraph_1')}</LandingParagraph>
      </div>
      <div className="h-96 border border-black w-full max-w-3xl">TODO: add demo video here</div>
      <Button style="primary" size="lg" className="font-bold mx-auto" onClick={connectAndRedirect}>
        {t('common:buttons.get_started')}
      </Button>
    </div>
  );
};

export default HeroSection;
