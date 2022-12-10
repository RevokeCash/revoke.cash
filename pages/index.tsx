import { displayGitcoinToast } from 'components/common/gitcoin-toast';
import PublicLayout from 'layouts/PublicLayout';
import { defaultSEO } from 'lib/next-seo.config';
import type { NextPage } from 'next';
import { NextSeo } from 'next-seo';
import useTranslation from 'next-translate/useTranslation';
import { useEffect } from 'react';

const App: NextPage = () => {
  const { t } = useTranslation();

  useEffect(() => {
    displayGitcoinToast();
  }, []);

  return (
    <>
      <NextSeo {...defaultSEO} title={t('common:meta.title')} description={t('common:meta.description')} />
      <PublicLayout>TODO: Add Landing Page Here</PublicLayout>
    </>
  );
};

export default App;
