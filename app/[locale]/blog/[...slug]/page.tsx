import MarkdownProse from 'components/common/MarkdownProse';
import { locales } from 'lib/i18n/config';
import { getAllContentSlugs, readAndParseContentFile } from 'lib/utils/markdown-content';
import type { Metadata, NextPage } from 'next';
import { setRequestLocale } from 'next-intl/server';

interface Props {
  params: Promise<Params>;
}

interface Params {
  locale: string;
  slug: string[];
}

export const dynamic = 'error';
export const dynamicParams = false;

export const generateStaticParams = () => {
  const slugs = getAllContentSlugs('blog');
  return locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
};

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { locale, slug } = await params;

  const { meta } = readAndParseContentFile(slug, locale, 'blog')!;

  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      images: meta.coverImage,
    },
  };
};

const BlogPostPage: NextPage<Props> = async ({ params }) => {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const { content } = readAndParseContentFile(slug, locale, 'blog')!;

  return <MarkdownProse content={content} />;
};

export default BlogPostPage;
