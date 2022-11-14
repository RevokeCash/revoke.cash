import { displayGitcoinToast } from 'components/common/gitcoin-toast';
import DashboardBody from 'components/Dashboard/DashboardBody';
import ConnectButton from 'components/Dashboard/header/ConnectButton';
import DashboardHeader from 'components/Dashboard/header/DashboardHeader';
import DonateButton from 'components/Dashboard/header/DonateButton';
import { MainLayout } from 'components/MainLayout';
import type { NextPage } from 'next';
import useTranslation from 'next-translate/useTranslation';
import { useEffect } from 'react';

const App: NextPage = () => {
  const { t } = useTranslation();

  useEffect(() => {
    displayGitcoinToast();
  }, []);

  return (
    <MainLayout>
      <div>
        <div className="dev py-4 w-1/2">
          <div className="flex justify-center gap-2">
            <div>
              <DonateButton />
            </div>
            <div>
              <ConnectButton />
            </div>
          </div>
        </div>

        <div>
          <DashboardHeader />
          <DashboardBody />
        </div>
      </div>
    </MainLayout>
  );
};

export default App;
