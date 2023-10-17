import MarkdownProse from 'components/common/MarkdownProse';
import LearnLayout from 'layouts/LearnLayout';
import { ContentMeta, ISidebarEntry } from 'lib/interfaces';
import { defaultSEO } from 'lib/next-seo.config';
import { getAllContentSlugs, getSidebar, getTranslationUrl, readAndParseContentFile } from 'lib/utils/markdown-content';
import { GetStaticPaths, GetStaticProps, NextPage } from 'next';
import { NextSeo } from 'next-seo';

interface Props {
  meta: ContentMeta;
  content: string;
  sidebar: ISidebarEntry[];
  slug: string[];
  translationUrl: string;
}

// TODO: Add Article JSON-LD
const LearnDocumentPage: NextPage<Props> = ({ meta, content, sidebar, slug, translationUrl }) => {
  return (
    <>
      <NextSeo {...defaultSEO} title={meta.title} description={meta.description} />
      <LearnLayout sidebarEntries={sidebar} slug={slug} meta={meta} translationUrl={translationUrl}>
        <MarkdownProse content={content} />
      </LearnLayout>
    </>
  );
};

export const getStaticProps: GetStaticProps = async ({ params, locale }) => {
  const { content, meta } = readAndParseContentFile(params.slug, locale, 'learn');
  const sidebar = await getSidebar(locale, 'learn');
  const translationUrl = await getTranslationUrl(params.slug, locale, 'learn');

  return {
    props: {
      meta,
      content,
      sidebar,
      slug: params.slug,
      translationUrl,
    },
  };
};

export const getStaticPaths: GetStaticPaths = async ({ locales }) => {
  const slugs = getAllContentSlugs('learn');

  const paths = locales.flatMap((locale) =>
    slugs.map((slug) => ({
      params: { slug },
      locale,
    })),
  );

  return {
    paths,
    fallback: false,
  };
};

export default LearnDocumentPage;
