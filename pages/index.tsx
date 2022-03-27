import 'react-toastify/dist/ReactToastify.css'
import React, { useEffect } from 'react'
import Dashboard from 'components/Dashboard/Dashboard'
import { Container } from 'react-bootstrap'
import Footer from 'components/Footer/Footer'
import Header from 'components/Header/Header'
import { WagmiProvider, InjectedConnector } from 'wagmi'
import { displayGitcoinToast } from 'components/common/gitcoin-toast'
import { NextPage } from 'next'

const App: NextPage = () => {
  useEffect(() => {
    displayGitcoinToast();
  }, [])

  return (
    <WagmiProvider autoConnect connectors={[new InjectedConnector()]}>
      <Container fluid className="App">
        <Header />
        <Dashboard />
        <Footer />
      </Container>
    </WagmiProvider>
  )
}

export default App
