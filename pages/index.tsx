import HeroSection from 'components/landing/HeroSection';
import HowTo from 'components/landing/HowTo';
import LandingPageFaq from 'components/landing/LandingPageFaq';
import Sponsors from 'components/landing/Sponsors';
import WhyRevokeCash from 'components/landing/WhyRevokeCash';
import LandingLayout from 'layouts/LandingLayout';
import { defaultSEO } from 'lib/next-seo.config';
import type { NextPage } from 'next';
import { LogoJsonLd, NextSeo } from 'next-seo';
import useTranslation from 'next-translate/useTranslation';

const LandingPage: NextPage = () => {
  const { t } = useTranslation();

  return (
    <>
      <NextSeo {...defaultSEO} title={t('common:meta.title')} description={t('common:meta.description')} />
      <LogoJsonLd logo="https://revoke.cash/assets/images/revoke-icon.svg" url="https://revoke.cash" />
      <LandingLayout>
        <div className="flex flex-col items-center gap-8">
          <HeroSection />
          <HowTo />
          <WhyRevokeCash />
          <LandingPageFaq />
          <Sponsors />
        </div>
      </LandingLayout>
    </>
  );
};

export default LandingPage;
