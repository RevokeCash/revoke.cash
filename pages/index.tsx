import { displayGitcoinToast } from 'components/common/gitcoin-toast';
import DashboardBody from 'components/Dashboard/DashboardBody';
import ConnectButton from 'components/Dashboard/header/ConnectButton';
import DashboardHeader from 'components/Dashboard/header/DashboardHeader';
import DonateButton from 'components/Dashboard/header/DonateButton';
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

      <div>
        <div className="py-4">
          <div className="flex justify-center sm:gap-2 h-10">
            <div className="hidden sm:block">
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
    </PublicLayout>
  );
};

export default App;
