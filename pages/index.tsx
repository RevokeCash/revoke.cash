import { displayGitcoinToast } from 'components/common/gitcoin-toast';
import DashboardWrapper from 'components/Dashboard/DashboardWrapper';
import { defaultSEO } from 'lib/next-seo.config';
import { NextPage } from 'next';
import { NextSeo } from 'next-seo';
import useTranslation from 'next-translate/useTranslation';
import { useEffect } from 'react';
import 'react-toastify/dist/ReactToastify.css';

const App: NextPage = () => {
  const { t } = useTranslation();

  useEffect(() => {
    displayGitcoinToast();
  }, []);

  return (
    <>
      <NextSeo {...defaultSEO} title={t('common:meta.title')} description={t('common:meta.description')} />
      <DashboardWrapper />
    </>
  );
};

export default App;
