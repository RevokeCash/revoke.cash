import SharedLayout from 'app/layouts/SharedLayout';
import AutomatedRevokingPageContent from 'components/premium/automated-revoking/AutomatedRevokingPageContent';
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
    title: t('premium.automated_revoking.meta.title'),
    description: t('premium.automated_revoking.meta.description'),
  };
};

const AutomatedRevokingPage: NextPage<Props> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <SharedLayout>
      <AutomatedRevokingPageContent />
    </SharedLayout>
  );
};

export default AutomatedRevokingPage;
