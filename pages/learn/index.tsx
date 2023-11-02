import Prose from 'components/common/Prose';
import ArticleCardSection from 'components/learn/ArticleCardSection';
import LearnLayout from 'layouts/LearnLayout';
import { ISidebarEntry } from 'lib/interfaces';
import { defaultSEO } from 'lib/next-seo.config';
import { getSidebar } from 'lib/utils/markdown-content';
import { GetStaticProps, NextPage } from 'next';
import { NextSeo } from 'next-seo';
import useTranslation from 'next-translate/useTranslation';

interface Props {
  sidebar: ISidebarEntry[];
}

const LearnPage: NextPage<Props> = ({ sidebar }: Props) => {
  const { t, lang } = useTranslation();

  const meta = { language: lang, coverImage: '/assets/images/learn/cover.jpg' };

  return (
    <>
      <NextSeo
        {...defaultSEO}
        title={t('learn:meta.title')}
        description={t('learn:meta.description')}
        openGraph={{
          ...defaultSEO.openGraph,
          images: [{ url: `https://revoke.cash${meta.coverImage}`, width: 1600, height: 900 }],
        }}
      />
      <LearnLayout sidebarEntries={sidebar} slug={[]} meta={meta}>
        <Prose>
          <h1>{t('learn:sections.home.title')}</h1>
          <p>
            {t('learn:meta.description')} {t('learn:sections.home.intro_paragraph')}
          </p>
          {sidebar.map((entry) => (
            <ArticleCardSection key={entry.title} {...entry} />
          ))}
        </Prose>
      </LearnLayout>
    </>
  );
};

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  const sidebar = await getSidebar(locale, 'learn', true);

  return {
    props: { sidebar },
  };
};

export default LearnPage;
