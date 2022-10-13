import { displayGitcoinToast } from 'components/common/gitcoin-toast';
import Dashboard from 'components/Dashboard/Dashboard';
import { defaultSEO } from 'lib/next-seo.config';
import { NextPage } from 'next';
import { NextSeo } from 'next-seo';
import useTranslation from 'next-translate/useTranslation';
import React, { useEffect } from 'react';
import 'react-toastify/dist/ReactToastify.css';

const App: NextPage = () => {
  const { t } = useTranslation();

  useEffect(() => {
    displayGitcoinToast();
  }, []);

  return (
    <>
      <NextSeo {...defaultSEO} title={t('common:meta.title')} description={t('common:meta.description')} />
      <Dashboard />
    </>
  );
};

export default App;
