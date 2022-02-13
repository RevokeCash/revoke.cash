import './App.scss'
import 'react-toastify/dist/ReactToastify.css'
import axios from 'axios'
import { providers } from 'ethers'
import React, { useEffect, useState } from 'react'
import Dashboard from './Dashboard/Dashboard'
import { Container } from 'react-bootstrap'
import { emitAnalyticsEvent } from './common/util'
import { providers as multicall } from '@0xsequence/multicall'
import Footer from './Footer/Footer'
import Header from './Header/Header'
import { WagmiProvider, InjectedConnector } from 'wagmi'
import { displayGitcoinToast } from './common/gitcoin-toast'

declare let window: {
  ethereum?: any
  web3?: any
  location: any
}

const App = () => {
  // Manage a provider separately from wagmi so that we can use the same multicall provider in the entire app
  const [provider, setProvider] = useState<multicall.MulticallProvider>()

  useEffect(() => {
    displayGitcoinToast();
    connectProvider()

    // Refresh the page when changing the network in Metamask
    if (window.ethereum) {
      window.ethereum.on('chainChanged', () => window.location.reload(false))
      window.ethereum.on('accountsChanged', () => window.location.reload(false))
    }
  }, [])

  const connectProvider = async () => {
    if (window.ethereum) {
      const provider = new providers.Web3Provider(window.ethereum)
      await updateProvider(provider)
      console.log('Using injected "window.ethereum" provider')
    } else if (window.web3 && window.web3.currentProvider) {
      const provider = new providers.Web3Provider(window.web3.currentProvider)
      await updateProvider(provider)
      console.log('Using injected "window.web3" provider')
    } else {
      try {
        // Use a default provider with a free Infura key if web3 is not available
        const provider = new providers.InfuraProvider('mainnet', `${'88583771d63544aa'}${'ba1006382275c6f8'}`)

        // Check that the provider is available (and not rate-limited) by sending a dummy request
        const dummyRequest = '{"method":"eth_getCode","params":["0x1f9840a85d5af5bf1d1762f925bdaddc4201f984","latest"],"id":0,"jsonrpc":"2.0"}'
        await axios.post(provider.connection.url, dummyRequest)
        await updateProvider(provider)
        console.log('Using fallback Infura provider')
      } catch {
        console.log('No web3 provider available')
      }
    }
  }

  const updateProvider = async (newProvider: providers.Provider) => {
    const { chainId } = await newProvider.getNetwork()
    emitAnalyticsEvent(`connect_wallet_${chainId}`)
    const multicallProvider = new multicall.MulticallProvider(newProvider, { verbose: true })
    setProvider(multicallProvider)
  }

  return (
    <WagmiProvider
      autoConnect
      connectors={[new InjectedConnector()]}
      provider={provider}
    >
      <Container fluid className="App">
        <Header />
        <Dashboard />
        <Footer />
      </Container>
    </WagmiProvider>
  )
}

export default App
