import LearnLayout from 'app/layouts/LearnLayout';
import Divider from 'components/common/Divider';
import Prose from 'components/common/Prose';
import ArticleCardSection from 'components/learn/ArticleCardSection';
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
    title: t('learn.meta.title'),
    description: t('learn.meta.description'),
    openGraph: {
      images: getOpenGraphImageUrl('/learn', locale),
    },
  };
};

const LearnPage: NextPage<Props> = async ({ params }: Props) => {
  unstable_setRequestLocale(params.locale);

  const sidebar = await getSidebar(params.locale, 'learn', true);
  const t = await getTranslations({ locale: params.locale });

  const meta = {
    title: t('learn.meta.title'),
    description: t('learn.meta.description'),
    language: params.locale,
    coverImage: getOpenGraphImageUrl('/learn', params.locale),
  };

  return (
    <LearnLayout sidebarEntries={sidebar} slug={[]} meta={meta}>
      <Prose>
        <h1>{t('learn.sections.home.title')}</h1>
        <Divider className="my-4" />
        <p>
          {t('learn.meta.description')} {t('learn.sections.home.intro_paragraph')}
        </p>
        {sidebar.map((entry) => (
          <ArticleCardSection key={entry.title} {...entry} />
        ))}
      </Prose>
    </LearnLayout>
  );
};

export default LearnPage;
