import LearnLayout from 'app/layouts/LearnLayout';
import Divider from 'components/common/Divider';
import Prose from 'components/common/Prose';
import ArticleCardSection from 'components/learn/ArticleCardSection';
import { locales } from 'lib/i18n/config';
import { getAllLearnCategories, getSidebar } from 'lib/utils/markdown-content';
import { Metadata, NextPage } from 'next';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';

interface Props {
  params: {
    locale: string;
    category: string;
  };
}

export const generateStaticParams = () => {
  const categorySlugs = getAllLearnCategories();
  return locales.flatMap((locale) => categorySlugs.map((category) => ({ locale, category })));
};

export const generateMetadata = async ({ params: { locale, category } }): Promise<Metadata> => {
  const t = await getTranslations({ locale });

  return {
    title: t(`learn.sections.${category}.title`),
    description: t('learn.meta.description'),
    openGraph: {
      images: `/assets/images/learn/${category}/cover.jpg`,
    },
  };
};

const LearnSectionPage: NextPage<Props> = async ({ params }: Props) => {
  unstable_setRequestLocale(params.locale);

  const sidebar = await getSidebar(params.locale, 'learn', true);
  const t = await getTranslations({ locale: params.locale });

  const meta = {
    title: t(`learn.sections.${params.category}.title`),
    description: t('learn.meta.description'),
    language: params.locale,
    sidebarTitle: t(`learn.sidebar.${params.category}`),
    coverImage: `/assets/images/learn/${params.category}/cover.jpg`,
  };

  return (
    <LearnLayout sidebarEntries={sidebar} slug={[params.category]} meta={meta}>
      <Prose>
        <h1>{t(`learn.sections.${params.category}.title`)}</h1>
        <Divider className="my-4" />
        <p>
          {t('learn.meta.description')} {t(`learn.sections.${params.category}.intro_paragraph`)}
        </p>
        {sidebar.map((entry) =>
          entry.path === `/learn/${params.category}` ? (
            <ArticleCardSection key={entry.title} children={entry.children} />
          ) : null,
        )}
      </Prose>
    </LearnLayout>
  );
};

export default LearnSectionPage;
