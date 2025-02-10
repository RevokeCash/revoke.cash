import SharedLayout from 'app/layouts/SharedLayout';
import HeroSection from 'components/landing/HeroSection';
import HowTo from 'components/landing/HowTo';
import LandingPageFaq from 'components/landing/LandingPageFaq';
import WhyRevokeCash from 'components/landing/WhyRevokeCash';
import type { Metadata, NextPage } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Script from 'next/script';

interface Props {
  params: Promise<Params>;
}

interface Params {
  locale: string;
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  logo: 'https://revoke.cash/assets/images/revoke-icon-orange-black.svg',
  url: 'https://revoke.cash',
};

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { locale } = await params;

  const t = await getTranslations({ locale });

  return {
    title: t('common.meta.title'),
    description: t('common.meta.description', { chainName: 'Ethereum' }),
  };
};

const LandingPage: NextPage<Props> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale);

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
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD needs to be injected using dangerouslySetInnerHTML */}
      <Script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
};

export default LandingPage;
