import Card from 'components/common/Card';
import Href from 'components/common/Href';
import Prose from 'components/common/Prose';
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

  return (
    <>
      <NextSeo {...defaultSEO} title={t('learn:meta.title')} description={t('learn:meta.description')} />
      <LearnLayout sidebarEntries={sidebar} slug={[]} meta={{ language: lang }}>
        <Prose>
          <h1>{t('learn:meta.title')}</h1>
          <p>
            {t('learn:meta.description')} {t('learn:home.intro_paragraph')}
          </p>
          {sidebar.map((entry) => (
            <Section key={entry.title} {...entry} />
          ))}
        </Prose>
      </LearnLayout>
    </>
  );
};

const Section = ({ title, children }: ISidebarEntry) => (
  <div className="mb-8 last:mb-0">
    <h2>{title}</h2>
    <div className="grid md:grid-cols-2 gap-4 items-stretch justify-center not-prose">
      {children.map((child) => (
        <Entry key={child.title} {...child} />
      ))}
    </div>
  </div>
);

const Entry = ({ title, description, path }: ISidebarEntry) => (
  <Href href={path} router underline="none" className="h-full">
    <Card title={title} className="h-full">
      <p>{description}</p>
    </Card>
  </Href>
);

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  const sidebar = await getSidebar(locale, 'learn', true);

  return {
    props: { sidebar },
  };
};

export default LearnPage;
