import ContentPageLayout from 'app/layouts/ContentPageLayout';
import MarkdownProse from 'components/common/MarkdownProse';
import { readAndParseContentFile } from 'lib/utils/markdown-content';
import { NextPage } from 'next';
import { unstable_setRequestLocale } from 'next-intl/server';

interface Props {
  params: {
    locale: string;
  };
}

export const metadata = {
  title: 'Terms and Conditions',
  description: 'Privacy Policy for Revoke.cash',
};

const TermsAndConditionsPage: NextPage<Props> = ({ params }) => {
  unstable_setRequestLocale(params.locale);
  const { content } = readAndParseContentFile('terms', params.locale, 'docs');

  return (
    <ContentPageLayout>
      <MarkdownProse content={content} />
    </ContentPageLayout>
  );
};

export default TermsAndConditionsPage;
