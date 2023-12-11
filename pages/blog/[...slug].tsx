import MarkdownProse from 'components/common/MarkdownProse';
import BlogLayout from 'layouts/BlogLayout';
import { ContentMeta, ISidebarEntry } from 'lib/interfaces';
import { defaultSEO } from 'lib/next-seo.config';
import { getAllContentSlugs, getSidebar, getTranslationUrl, readAndParseContentFile } from 'lib/utils/markdown-content';
import { GetStaticPaths, GetStaticProps, NextPage } from 'next';
import { NextSeo } from 'next-seo';

interface Props {
  meta: ContentMeta;
  content: string;
  posts: ISidebarEntry[];
  slug: string[];
  translationUrl: string;
}

const BlogPostPage: NextPage<Props> = ({ meta, content, posts, slug, translationUrl }) => {
  return (
    <>
      <NextSeo
        {...defaultSEO}
        title={meta.title}
        description={meta.description}
        openGraph={{
          ...defaultSEO.openGraph,
          images: meta.coverImage
            ? [{ url: `https://revoke.cash${meta.coverImage}`, width: 1600, height: 900 }]
            : defaultSEO.openGraph.images,
        }}
      />
      <BlogLayout posts={posts} slug={slug} meta={meta} translationUrl={translationUrl} searchBar={false}>
        <MarkdownProse content={content} />
      </BlogLayout>
    </>
  );
};

export const getStaticProps: GetStaticProps = async ({ params, locale }) => {
  const { content, meta } = readAndParseContentFile(params.slug, locale, 'blog');
  const posts = await getSidebar(locale, 'blog');
  const translationUrl = await getTranslationUrl(params.slug, locale, 'blog');

  return {
    props: {
      meta,
      content,
      posts,
      slug: params.slug,
      translationUrl,
    },
  };
};

export const getStaticPaths: GetStaticPaths = async ({ locales }) => {
  const slugs = getAllContentSlugs('blog');

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

export default BlogPostPage;
