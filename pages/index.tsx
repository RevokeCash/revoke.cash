import { displayGitcoinToast } from 'components/common/gitcoin-toast';
import DashboardBody from 'components/Dashboard/DashboardBody';
import ConnectSection from 'components/Dashboard/header/ConnectSection';
import DashboardHeader from 'components/Dashboard/header/DashboardHeader';
import { PublicLayout } from 'layouts/PublicLayout';
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
    <PublicLayout>
      <NextSeo {...defaultSEO} title={t('common:meta.title')} description={t('common:meta.description')} />
      <ConnectSection />
      <DashboardHeader />
      <DashboardBody />
    </PublicLayout>
  );
};

export default App;
