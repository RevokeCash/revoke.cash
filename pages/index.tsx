import { displayGitcoinToast } from 'components/common/gitcoin-toast';
import Dashboard from 'components/Dashboard/Dashboard';
import { NextPage } from 'next';
import React, { useEffect } from 'react';
import 'react-toastify/dist/ReactToastify.css';

const App: NextPage = () => {
  useEffect(() => {
    displayGitcoinToast();
  }, []);

  return <Dashboard />;
};

export default App;
