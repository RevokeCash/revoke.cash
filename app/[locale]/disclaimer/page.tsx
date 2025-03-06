import ContentPageLayout from 'app/layouts/ContentPageLayout';
import MarkdownProse from 'components/common/MarkdownProse';
import { readAndParseContentFile } from 'lib/utils/markdown-content';
import type { NextPage } from 'next';
import { setRequestLocale } from 'next-intl/server';

interface Props {
  params: Promise<Params>;
}

interface Params {
  locale: string;
}

export const dynamic = 'error';

export const metadata = {
  title: 'Disclaimer',
  description: 'Disclaimer for Revoke.cash',
};

const DisclaimerPage: NextPage<Props> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale);

  const { content } = readAndParseContentFile('disclaimer', locale, 'docs')!;

  return (
    <ContentPageLayout>
      <MarkdownProse content={content} />
    </ContentPageLayout>
  );
};

export default DisclaimerPage;
