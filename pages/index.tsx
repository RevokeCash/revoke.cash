import { displayGitcoinToast } from 'components/common/gitcoin-toast';
import Dashboard from 'components/Dashboard/Dashboard';
import Footer from 'components/Footer/Footer';
import Header from 'components/Header/Header';
import { NextPage } from 'next';
import React, { useEffect } from 'react';
import { Container } from 'react-bootstrap';
import 'react-toastify/dist/ReactToastify.css';
import { EthereumProvider } from 'utils/hooks/useEthereum';

const App: NextPage = () => {
  useEffect(() => {
    displayGitcoinToast();
  }, []);

  return (
    <EthereumProvider>
      <Container fluid className="App">
        <Header />
        <Dashboard />
        <Footer />
      </Container>
    </EthereumProvider>
  );
};

export default App;
