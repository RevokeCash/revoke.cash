import MarkdownProse from 'components/common/MarkdownProse';
import { locales } from 'lib/i18n/config';
import { getAllContentSlugs, readAndParseContentFile } from 'lib/utils/markdown-content';
import { Metadata, NextPage } from 'next';
import { unstable_setRequestLocale } from 'next-intl/server';

interface Props {
  params: {
    locale: string;
    slug: string[];
  };
}

export const dynamic = 'error';
export const dynamicParams = false;

export const generateStaticParams = () => {
  const slugs = getAllContentSlugs('blog');
  return locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
};

export const generateMetadata = async ({ params: { locale, slug } }: Props): Promise<Metadata> => {
  const { meta } = readAndParseContentFile(slug, locale, 'blog');

  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      images: meta.coverImage,
    },
  };
};

const BlogPostPage: NextPage<Props> = ({ params }) => {
  unstable_setRequestLocale(params.locale);

  const { content } = readAndParseContentFile(params.slug, params.locale, 'blog');

  return <MarkdownProse content={content} />;
};

export default BlogPostPage;
