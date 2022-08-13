import { displayGitcoinToast } from 'components/common/gitcoin-toast';
import Dashboard from 'components/Dashboard/Dashboard';
import { NextPage } from 'next';
import { NextSeo } from 'next-seo';
import React, { useEffect } from 'react';
import 'react-toastify/dist/ReactToastify.css';
import { defaultSEO } from 'utils/next-seo.config';

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
