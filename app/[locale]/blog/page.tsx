import ContentPageHero from 'components/common/ContentPageHero';
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
    <div className="max-w-5xl mx-auto px-4">
      <ContentPageHero title={t('blog.meta.title')} subtitle={t('blog.meta.description')} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {posts.map((entry) => (
          <ArticleCard key={entry.title} {...entry} />
        ))}
      </div>
    </div>
  );
};

export default BlogPage;
