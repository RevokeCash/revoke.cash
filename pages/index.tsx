import { displayGitcoinToast } from 'components/common/gitcoin-toast';
import DashboardBody from 'components/Dashboard/DashboardBody';
import ConnectSection from 'components/Dashboard/header/ConnectSection';
import DashboardHeader from 'components/Dashboard/header/DashboardHeader';
import Footer from 'components/Footer/Footer';
import Header from 'components/Header/Header';
import type { NextPage } from 'next';
import useTranslation from 'next-translate/useTranslation';
import { useEffect } from 'react';

const App: NextPage = () => {
  const { t } = useTranslation();

  useEffect(() => {
    displayGitcoinToast();
  }, []);

  return (
    <div className="min-h-full">
      <div className="flex-none">
        <Header />
      </div>

      <div className="flex-grow">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <ConnectSection />
          <DashboardHeader />
          <DashboardBody />
        </div>
      </div>

      <div>
        <Footer />
      </div>
    </div>
  );
};

export default App;
