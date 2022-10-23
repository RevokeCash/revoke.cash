import { displayGitcoinToast } from 'components/common/gitcoin-toast';
import Dashboard from 'components/Dashboard/Dashboard';
import { defaultSEO } from 'lib/next-seo.config';
import { NextPage } from 'next';
import { NextSeo } from 'next-seo';
import { useEffect } from 'react';
import 'react-toastify/dist/ReactToastify.css';

const App: NextPage = () => {
  useEffect(() => {
    displayGitcoinToast();
  }, []);

  return (
    <>
      <NextSeo {...defaultSEO} />
      <Dashboard />
    </>
  );
};

export default App;
