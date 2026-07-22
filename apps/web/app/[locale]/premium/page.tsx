import SharedLayout from 'app/layouts/SharedLayout';
import PremiumPricingPageContent from 'components/premium/pricing/PremiumPricingPageContent';
import NextIntlClientProvider from 'lib/i18n/NextIntlClientProvider';
import type { Metadata, NextPage } from 'next';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';

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

  const messages = await getMessages({ locale });

  return (
    <SharedLayout padding>
      <NextIntlClientProvider messages={{ common: messages.common, premium: messages.premium }}>
        <PremiumPricingPageContent />
      </NextIntlClientProvider>
    </SharedLayout>
  );
};

export default PremiumPricingPage;
