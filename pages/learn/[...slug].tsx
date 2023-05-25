import DangerousProse from 'components/common/DangerousProse';
import matter from 'gray-matter';
import LearnLayout from 'layouts/LearnLayout';
import { contentDirectory, markdownToHtml, readContentFile } from 'lib/utils/markdown';
import { GetStaticPaths, GetStaticProps } from 'next';
import { join } from 'path';
const walk = require('walkdir');

export default function Doc({ meta, content }) {
  return (
    <LearnLayout>
      <DangerousProse content={content} />
    </LearnLayout>
  );
}

export const getStaticProps: GetStaticProps = async ({ params, locale }) => {
  const fileContent = readContentFile(params.slug, locale);
  const { data: meta, content: markdown } = matter(fileContent);
  const content = markdownToHtml(markdown);

  return {
    props: {
      meta,
      content,
    },
  };
};

export const getStaticPaths: GetStaticPaths = async ({ locales }) => {
  const learnDirectory = join(contentDirectory, 'en', 'learn');
  console.log(learnDirectory);
  const slugs: string[] = walk
    .sync(learnDirectory)
    .filter((path: string) => path.endsWith('.md'))
    .map((path: string) => path.replace(`${learnDirectory}/`, ''))
    .map((path: string) => path.replace(/\.md$/, ''))
    .map((path: string) => path.split('/'));
  console.log(slugs);

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
