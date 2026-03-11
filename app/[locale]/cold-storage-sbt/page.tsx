import ProseLayout from 'app/layouts/ProseLayout';
import Divider from 'components/common/Divider';
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
    <ProseLayout>
      <h1>
        Revoke.cash x Pudgy Penguins <br /> Cold Storage SBT
      </h1>
      <Divider className="my-4" />

      <p>
        <RichText>{(tags) => t.rich('pudgy.landing.paragraph_1', tags)}</RichText>
      </p>
      <video
        src="assets/videos/pudgy-sbt.mp4"
        className="aspect-square w-full max-w-100 my-0 mx-auto fade-video"
        autoPlay
        muted
        loop
      />
      <p>
        <RichText>{(tags) => t.rich('pudgy.landing.paragraph_2', tags)}</RichText>
      </p>

      <div className="flex flex-col gap-4 not-prose">
        <NextIntlClientProvider messages={{ common: messages.common, pudgy: messages.pudgy }}>
          <PudgyCheckerWrapper />
        </NextIntlClientProvider>
      </div>
    </ProseLayout>
  );
};

export default PudgyPage;
