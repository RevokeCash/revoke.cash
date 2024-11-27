import ArticleCard from 'components/learn/ArticleCard';
import { getSidebar } from 'lib/utils/markdown-content';
import { getOpenGraphImageUrl } from 'lib/utils/og';
import { Metadata, NextPage } from 'next';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';

interface Props {
  params: {
    locale: string;
  };
}

export const dynamic = 'error';

export const generateMetadata = async ({ params: { locale } }: Props): Promise<Metadata> => {
  const t = await getTranslations({ locale });

  return {
    title: t('blog.meta.title'),
    description: t('blog.meta.description'),
    openGraph: {
      images: getOpenGraphImageUrl('/blog', locale),
    },
  };
};

const BlogPage: NextPage<Props> = async ({ params }: Props) => {
  unstable_setRequestLocale(params.locale);

  const t = await getTranslations({ locale: params.locale });
  const posts = await getSidebar(params.locale, 'blog', true);

  return (
    <>
      <div className="max-w-3xl mx-auto text-center mb-12">
        <h1 className="mb-4">{t('blog.meta.title')}.</h1>
        <p className="md:text-xl">{t('blog.meta.description')}</p>
      </div>
      <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-4">
        {posts.map((entry) => (
          <div className="max-w-md md:max-w-xs" key={entry.title}>
            <ArticleCard {...entry} />
          </div>
        ))}
      </div>
    </>
  );
};

export default BlogPage;
