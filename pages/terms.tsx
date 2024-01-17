import MarkdownProse from 'components/common/MarkdownProse';
import ContentPageLayout from 'layouts/ContentPageLayout';
import { defaultSEO } from 'lib/next-seo.config';
import { readAndParseContentFile } from 'lib/utils/markdown-content';
import { GetStaticProps, NextPage } from 'next';
import { NextSeo } from 'next-seo';

interface Props {
  content: string;
}

const TermsAndConditionsPage: NextPage<Props> = ({ content }) => {
  return (
    <>
      <NextSeo {...defaultSEO} title="Terms and Conditions" description="Terms and Conditions for Revoke.cash" />
      <ContentPageLayout searchBar={false}>
        <MarkdownProse content={content} />
      </ContentPageLayout>
    </>
  );
};

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  const { content } = readAndParseContentFile('terms', locale, 'docs');

  return {
    props: {
      content,
    },
  };
};

export default TermsAndConditionsPage;
