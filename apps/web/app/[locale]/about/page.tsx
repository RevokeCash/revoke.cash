import SharedLayout from 'app/layouts/SharedLayout';
import Timeline from 'components/about/Timeline';
import ContentPageHero from 'components/common/ContentPageHero';
import type { Metadata, NextPage } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

interface Props {
  params: Promise<Params>;
}

interface Params {
  locale: string;
}

export const dynamic = 'error';

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { locale } = await params;

  const t = await getTranslations({ locale });

  return {
    title: t('about.meta.title'),
    description: t('about.meta.description'),
  };
};

const AboutPage: NextPage<Props> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale });

  return (
    <SharedLayout padding>
      <ContentPageHero title={t('about.title')} />
      <div className="max-w-4xl mx-auto">
        <Timeline />
      </div>
    </SharedLayout>
  );
};

export default AboutPage;
