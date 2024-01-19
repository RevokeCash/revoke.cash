import MarkdownProse from 'components/common/MarkdownProse';
import ContentPageLayout from 'layouts/ContentPageLayout';
import { defaultSEO } from 'lib/next-seo.config';
import { readAndParseContentFile } from 'lib/utils/markdown-content';
import { GetStaticProps, NextPage } from 'next';
import { NextSeo } from 'next-seo';

interface Props {
  content: string;
}

const PrivacyPolicyPage: NextPage<Props> = ({ content }) => {
  return (
    <>
      <NextSeo {...defaultSEO} title="Privacy Policy" description="Privacy Policy for Revoke.cash" />
      <ContentPageLayout>
        <MarkdownProse content={content} />
      </ContentPageLayout>
    </>
  );
};

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  const { content } = readAndParseContentFile('privacy-policy', locale, 'docs');

  return {
    props: {
      content,
    },
  };
};

export default PrivacyPolicyPage;
