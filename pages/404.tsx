import PublicLayout from 'layouts/PublicLayout';
import { defaultSEO } from 'lib/next-seo.config';
import type { NextPage } from 'next';
import { NextSeo } from 'next-seo';
import useTranslation from 'next-translate/useTranslation';

const Error404: NextPage = () => {
  const { t } = useTranslation();

  return (
    <>
      <NextSeo {...defaultSEO} title={t('common:meta.title')} description={t('common:meta.description')} />
      <PublicLayout>
        <h1 className="text-center">{t('common:errors.404.title')}</h1>
      </PublicLayout>
    </>
  );
};

export default Error404;
