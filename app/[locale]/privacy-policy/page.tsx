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
  title: 'Privacy Policy',
  description: 'Privacy Policy for Revoke.cash',
};

const PrivacyPolicyPage: NextPage<Props> = ({ params }) => {
  unstable_setRequestLocale(params.locale);
  const { content } = readAndParseContentFile('privacy-policy', params.locale, 'docs')!;

  return (
    <ContentPageLayout>
      <MarkdownProse content={content} />
    </ContentPageLayout>
  );
};

export default PrivacyPolicyPage;
