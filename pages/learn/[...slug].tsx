import DangerousProse from 'components/common/DangerousProse';
import matter from 'gray-matter';
import LearnLayout from 'layouts/LearnLayout';
import { ISidebarEntry } from 'lib/interfaces';
import { getAllContentSlugs, getSidebar, markdownToHtml, readContentFile } from 'lib/utils/markdown';
import { GetStaticPaths, GetStaticProps } from 'next';

interface Props {
  meta: Record<string, any>;
  content: string;
  sidebar: ISidebarEntry[];
}

export default function Doc({ meta, content, sidebar }: Props) {
  return (
    <LearnLayout sidebarEntries={sidebar}>
      <DangerousProse content={content} />
    </LearnLayout>
  );
}

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
