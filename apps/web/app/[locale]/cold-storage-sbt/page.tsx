import ContentPageLayout from 'app/layouts/ContentPageLayout';
import ContentPageHero from 'components/common/ContentPageHero';
import Prose from 'components/common/Prose';
import RichText from 'components/common/RichText';
import NextIntlClientProvider from 'lib/i18n/NextIntlClientProvider';
import type { Metadata, NextPage } from 'next';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import PudgyCheckerWrapper from './PudgyCheckerWrapper';

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
    title: 'Revoke.cash x Pudgy Penguins SBT',
    description: t('pudgy.landing.paragraph_1'),
  };
};

const PudgyPage: NextPage<Props> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale });
  const messages = await getMessages({ locale });

  return (
    <ContentPageLayout hero={<ContentPageHero title="Revoke.cash x Pudgy Penguins SBT" />}>
      <Prose>
        <p>
          <RichText>{(tags) => t.rich('pudgy.landing.paragraph_1', tags)}</RichText>
        </p>
      </Prose>

      <video
        src="assets/videos/pudgy-sbt.mp4"
        className="aspect-square w-full max-w-100 my-6 mx-auto fade-video"
        autoPlay
        muted
        loop
      />

      <Prose>
        <p>
          <RichText>{(tags) => t.rich('pudgy.landing.paragraph_2', tags)}</RichText>
        </p>
      </Prose>

      <div className="flex flex-col gap-4 mt-6">
        <NextIntlClientProvider messages={{ common: messages.common, pudgy: messages.pudgy }}>
          <PudgyCheckerWrapper />
        </NextIntlClientProvider>
      </div>
    </ContentPageLayout>
  );
};

export default PudgyPage;
