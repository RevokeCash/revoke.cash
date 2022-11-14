import { displayGitcoinToast } from 'components/common/gitcoin-toast';
import DashboardBody from 'components/Dashboard/DashboardBody';
import ConnectSection from 'components/Dashboard/header/ConnectSection';
import DashboardHeader from 'components/Dashboard/header/DashboardHeader';
import type { NextPage } from 'next';
import useTranslation from 'next-translate/useTranslation';
import { useEffect } from 'react';

const App: NextPage = () => {
  const { t } = useTranslation();

  useEffect(() => {
    displayGitcoinToast();
  }, []);

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <ConnectSection />
        <DashboardHeader />
        <DashboardBody />
      </div>
    </>
  );
};

export default App;
