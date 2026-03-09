import SharedLayout from 'app/layouts/SharedLayout';
import PricingPage from 'components/premium/PricingPage';
import type { Metadata, NextPage } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

interface Props {
  params: Promise<Params>;
}

interface Params {
  locale: string;
}

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: t('premium.pricing.meta.title'),
    description: t('premium.pricing.meta.description'),
  };
};

const PremiumPricingPage: NextPage<Props> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <SharedLayout>
      <PricingPage />
    </SharedLayout>
  );
};

export default PremiumPricingPage;
