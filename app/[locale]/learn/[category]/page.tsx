import LearnLayout from 'app/layouts/LearnLayout';
import Divider from 'components/common/Divider';
import Prose from 'components/common/Prose';
import ArticleCardSection from 'components/learn/ArticleCardSection';
import { locales } from 'lib/i18n/config';
import { getAllLearnCategories, getSidebar } from 'lib/utils/markdown-content';
import { getOpenGraphImageUrl } from 'lib/utils/og';
import type { Metadata, NextPage } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

interface Props {
  params: Promise<Params>;
}

interface Params {
  locale: string;
  category: string;
}

export const dynamic = 'error';
export const dynamicParams = false;

export const generateStaticParams = () => {
  const categorySlugs = getAllLearnCategories();
  return locales.flatMap((locale) => categorySlugs.map((category) => ({ locale, category })));
};

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { locale, category } = await params;

  const t = await getTranslations({ locale });

  return {
    title: t(`learn.sections.${category}.title`),
    description: t('learn.meta.description'),
    openGraph: {
      images: getOpenGraphImageUrl(`/learn/${category}`, locale),
    },
  };
};

const LearnSectionPage: NextPage<Props> = async ({ params }) => {
  const { locale, category } = await params;
  setRequestLocale(locale);

  const sidebar = await getSidebar(locale, 'learn', true);
  const t = await getTranslations({ locale });

  const meta = {
    title: t(`learn.sections.${category}.title`),
    description: t('learn.meta.description'),
    language: locale,
    sidebarTitle: t(`learn.sidebar.${category}`),
    coverImage: getOpenGraphImageUrl(`/learn/${category}`, locale),
  };

  return (
    <LearnLayout sidebarEntries={sidebar} slug={[category]} meta={meta}>
      <Prose>
        <h1>{t(`learn.sections.${category}.title`)}</h1>
        <Divider className="my-4" />
        <p>
          {t('learn.meta.description')} {t(`learn.sections.${category}.intro_paragraph`)}
        </p>
        {sidebar.map((entry) =>
          entry.path === `/learn/${category}` ? (
            <ArticleCardSection key={entry.title}>{entry.children}</ArticleCardSection>
          ) : null,
        )}
      </Prose>
    </LearnLayout>
  );
};

export default LearnSectionPage;
