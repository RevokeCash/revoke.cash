import SharedLayout from 'app/layouts/SharedLayout';
import PricingPage from 'components/premium/PricingPage';
import type { Metadata, NextPage } from 'next';
import { setRequestLocale } from 'next-intl/server';

interface Props {
  params: Promise<Params>;
}

interface Params {
  locale: string;
}

export const generateMetadata = async (): Promise<Metadata> => {
  return {
    title: 'Premium Pricing',
    description: 'Compare Revoke.cash plans. Get the multichain dashboard, unlimited batch revokes, and more.',
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
