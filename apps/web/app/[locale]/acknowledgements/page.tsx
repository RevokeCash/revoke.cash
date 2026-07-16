import ContentPageLayout from 'app/layouts/ContentPageLayout';
import MarkdownProse from 'components/common/MarkdownProse';
import { readAndParseContentFile } from 'lib/utils/markdown-content';
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
    title: t('common.meta.acknowledgements.title'),
    description: t('common.meta.acknowledgements.description'),
  };
};

const AcknowledgementsPage: NextPage<Props> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale);

  const { content } = readAndParseContentFile('acknowledgements', locale, 'pages')!;

  return (
    <ContentPageLayout>
      <MarkdownProse content={content} />
    </ContentPageLayout>
  );
};

export default AcknowledgementsPage;
