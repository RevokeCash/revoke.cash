import ContentPageLayout from 'app/layouts/ContentPageLayout';
import MarkdownProse from 'components/common/MarkdownProse';
import { readAndParseContentFile } from 'lib/utils/markdown-content';
import type { NextPage } from 'next';
import { unstable_setRequestLocale } from 'next-intl/server';

interface Props {
  params: {
    locale: string;
  };
}

export const dynamic = 'error';

export const metadata = {
  title: 'Disclaimer',
  description: 'Disclaimer for Revoke.cash',
};

const DisclaimerPage: NextPage<Props> = ({ params }) => {
  unstable_setRequestLocale(params.locale);
  const { content } = readAndParseContentFile('disclaimer', params.locale, 'docs')!;

  return (
    <ContentPageLayout>
      <MarkdownProse content={content} />
    </ContentPageLayout>
  );
};

export default DisclaimerPage;
