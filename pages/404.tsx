import ContentPageLayout from 'layouts/ContentPageLayout';
import { defaultSEO } from 'lib/next-seo.config';
import type { NextPage } from 'next';
import { NextSeo } from 'next-seo';
import useTranslation from 'next-translate/useTranslation';

const Error404: NextPage = () => {
  const { t } = useTranslation();

  return (
    <>
      <NextSeo {...defaultSEO} title={t('common:meta.title')} description={t('common:meta.description')} />
      <ContentPageLayout>
        <h1>{t('common:errors.404.title')}</h1>
      </ContentPageLayout>
    </>
  );
};

export default Error404;
