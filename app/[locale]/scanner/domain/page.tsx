import ProseLayout from 'app/layouts/ProseLayout';
import RichText from 'components/common/RichText';
import { KERBERUS_API_KEY } from 'lib/constants';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import KerberusWidget from './KerberusWidget';

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
    title: t('domain_checker.meta.title'),
    description: t('domain_checker.meta.description'),
  };
};

const DomainScannerPage = async ({ params }: Props) => {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale });

  if (!KERBERUS_API_KEY) return notFound();

  return (
    <ProseLayout searchBar={false}>
      <h1 className="text-4xl md:text-5xl not-prose items-center gap-2 mb-12 text-center">
        {t('domain_checker.title')}
      </h1>
      <p>
        <RichText>{(tags) => t.rich('domain_checker.description', tags)}</RichText>
      </p>
      <div className="not-prose">
        <KerberusWidget />
      </div>
    </ProseLayout>
  );
};

export default DomainScannerPage;
