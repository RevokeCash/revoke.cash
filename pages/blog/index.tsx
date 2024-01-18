import ArticleCard from 'components/learn/ArticleCard';
import PublicLayout from 'layouts/PublicLayout';
import { ISidebarEntry } from 'lib/interfaces';
import { defaultSEO } from 'lib/next-seo.config';
import { getSidebar } from 'lib/utils/markdown-content';
import { GetStaticProps, NextPage } from 'next';
import { NextSeo } from 'next-seo';
import useTranslation from 'next-translate/useTranslation';

interface Props {
  posts: ISidebarEntry[];
}

const BlogPage: NextPage<Props> = ({ posts }: Props) => {
  const { t, lang } = useTranslation();

  const meta = {
    title: t('blog:meta.title'),
    description: t('blog:meta.description'),
    language: lang,
    coverImage: '/assets/images/blog/cover.jpg',
  };

  return (
    <>
      <NextSeo
        {...defaultSEO}
        title={meta.title}
        description={meta.description}
        openGraph={{
          ...defaultSEO.openGraph,
          images: [{ url: `https://revoke.cash${meta.coverImage}`, width: 1600, height: 900 }],
        }}
      />
      <PublicLayout searchBar={false}>
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h1 className="mb-4">{t('blog:meta.title')}.</h1>
          <p className="md:text-xl">{t('blog:meta.description')}</p>
        </div>
        <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-4">
          {posts.map((entry) => (
            <div className="max-w-md md:max-w-xs" key={entry.title}>
              <ArticleCard {...entry} />
            </div>
          ))}
        </div>
      </PublicLayout>
    </>
  );
};

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  const posts = await getSidebar(locale, 'blog', true);

  return {
    props: { posts },
  };
};

export default BlogPage;
