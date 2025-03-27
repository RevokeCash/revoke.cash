import ArticleCard from 'components/learn/ArticleCard';
import { getSidebar } from 'lib/utils/markdown-content';
import { getOpenGraphImageUrl } from 'lib/utils/og';
import type { Metadata, NextPage } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

interface Props {
  params: Promise<Params>;
}

interface Params {
  locale: string;
}

export const dynamic = 'error';

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { locale } = await params;

  const t = await getTranslations({ locale });

  return {
    title: t('blog.meta.title'),
    description: t('blog.meta.description'),
    openGraph: {
      images: getOpenGraphImageUrl('/blog', locale),
    },
  };
};

const BlogPage: NextPage<Props> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale });
  const posts = await getSidebar(locale, 'blog', true);

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
