import DangerousProse from 'components/common/DangerousProse';
import matter from 'gray-matter';
import LearnLayout from 'layouts/LearnLayout';
import { ContentMeta, ISidebarEntry } from 'lib/interfaces';
import { defaultSEO } from 'lib/next-seo.config';
import { getAllContentSlugs, getSidebar, markdownToHtml, readContentFile } from 'lib/utils/markdown';
import { GetStaticPaths, GetStaticProps, NextPage } from 'next';
import { NextSeo } from 'next-seo';

interface Props {
  meta: ContentMeta;
  content: string;
  sidebar: ISidebarEntry[];
  slug: string[];
}

const LearnDocumentPage: NextPage<Props> = ({ meta, content, sidebar, slug }) => {
  return (
    <>
      <NextSeo {...defaultSEO} title={meta.title} description={meta.description} />
      <LearnLayout sidebarEntries={sidebar} slug={slug} meta={meta}>
        <DangerousProse content={content} />
      </LearnLayout>
    </>
  );
};

export const getStaticProps: GetStaticProps = async ({ params, locale }) => {
  const fileContent = readContentFile(params.slug, locale);
  const { data: meta, content: markdown } = matter(fileContent);
  const content = markdownToHtml(markdown);
  const sidebar = await getSidebar(locale, 'learn');

  return {
    props: {
      meta,
      content,
      sidebar,
      slug: params.slug,
    },
  };
};

export const getStaticPaths: GetStaticPaths = async ({ locales }) => {
  const slugs = getAllContentSlugs('learn');

  const paths = locales.flatMap((locale) =>
    slugs.map((slug) => ({
      params: { slug },
      locale,
    }))
  );

  return {
    paths,
    fallback: false,
  };
};

export default LearnDocumentPage;
