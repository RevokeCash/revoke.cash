import Divider from 'components/common/Divider';
import Prose from 'components/common/Prose';
import ArticleCardSection from 'components/learn/ArticleCardSection';
import LearnLayout from 'layouts/LearnLayout';
import { ISidebarEntry } from 'lib/interfaces';
import { defaultSEO } from 'lib/next-seo.config';
import { deduplicateArray } from 'lib/utils';
import { getAllContentSlugs, getSidebar } from 'lib/utils/markdown-content';
import { GetStaticPaths, GetStaticProps, NextPage } from 'next';
import { NextSeo } from 'next-seo';
import useTranslation from 'next-translate/useTranslation';

interface Props {
  sidebar: ISidebarEntry[];
  slug: string;
}

const LearnSectionPage: NextPage<Props> = ({ sidebar, slug }: Props) => {
  const { t, lang } = useTranslation();

  const meta = {
    title: t(`learn:sections.${slug}.title`),
    description: t('learn:meta.description'),
    language: lang,
    sidebarTitle: t(`learn:sidebar.${slug}`),
    coverImage: `/assets/images/learn/${slug}/cover.jpg`,
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
      <LearnLayout sidebarEntries={sidebar} slug={[slug]} meta={meta}>
        <Prose>
          <h1>{t(`learn:sections.${slug}.title`)}</h1>
          <Divider className="my-4" />
          <p>
            {t('learn:meta.description')} {t(`learn:sections.${slug}.intro_paragraph`)}
          </p>
          {sidebar.map((entry) =>
            entry.path === `/learn/${slug}` ? <ArticleCardSection key={entry.title} children={entry.children} /> : null,
          )}
        </Prose>
      </LearnLayout>
    </>
  );
};

export const getStaticProps: GetStaticProps = async ({ params, locale }) => {
  const sidebar = await getSidebar(locale, 'learn', true);

  return {
    props: { sidebar, slug: params.slug },
  };
};

export const getStaticPaths: GetStaticPaths = async ({ locales }) => {
  const contentSlugs = getAllContentSlugs('learn');
  const sectionSlugs = deduplicateArray(contentSlugs.map((slug) => slug[0]));
  sectionSlugs.push('wallets');

  const paths = locales.flatMap((locale) =>
    sectionSlugs.map((slug) => ({
      params: { slug },
      locale,
    })),
  );

  return {
    paths,
    fallback: false,
  };
};

export default LearnSectionPage;
