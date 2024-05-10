import SharedLayout from 'app/layouts/SharedLayout';
import HeroSection from 'components/landing/HeroSection';
import HowTo from 'components/landing/HowTo';
import LandingPageFaq from 'components/landing/LandingPageFaq';
import WhyRevokeCash from 'components/landing/WhyRevokeCash';
import type { Metadata, NextPage } from 'next';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import Script from 'next/script';

interface Props {
  params: {
    locale: string;
  };
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  logo: 'https://revoke.cash/assets/images/revoke-icon-orange-black.svg',
  url: 'https://revoke.cash',
};

export const generateMetadata = async ({ params: { locale } }): Promise<Metadata> => {
  const t = await getTranslations({ locale });

  return {
    title: t('common.meta.title'),
    description: t('common.meta.description', { chainName: 'Ethereum' }),
  };
};

const LandingPage: NextPage<Props> = ({ params }) => {
  unstable_setRequestLocale(params.locale);

  return (
    <>
      <SharedLayout>
        <div className="flex flex-col items-center gap-8">
          <HeroSection />
          <HowTo />
          <WhyRevokeCash />
          <LandingPageFaq />
        </div>
      </SharedLayout>
      <Script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
};

export default LandingPage;
