import './App.css'
import React, { Component, ReactNode } from 'react'
import { Web3Provider, Provider } from 'ethers/providers'
import TokenList from './TokenList'
import { Signer, getDefaultProvider } from 'ethers'

declare let window: any
declare let web3: any

type AppState = {
  provider?: Provider,
  signer?: Signer,
}

class App extends Component<{}, AppState> {
  state: AppState = {}

  async componentDidMount() {
    // Set default provider for READ operations
    this.setState({ provider: getDefaultProvider() })

    // Connect with Web3 provider for WRITE opertions if access is already granted
    if (window.ethereum || window.web3) {
      try {
        const signer = new Web3Provider(web3.currentProvider).getSigner()
        // Check if access is granted
        await signer.getAddress()
        this.setState({ signer })
      } catch (e) {} // ignored
    }
  }

  async connectWeb3() {
    if (window.ethereum) {
      try {
        // Request account access if needed
        await window.ethereum.enable();
      } catch (error) {
        // User denied account access...
        return
      }
    }

    this.setState({ signer: new Web3Provider(web3.currentProvider).getSigner() })
  }

  render(): ReactNode {
    return (
      <div className="App">
        <img src="revoke.svg" alt="revoke.cash logo" className="logo" />
        {this.state.signer
          ? <TokenList provider={this.state.provider} signer={this.state.signer} />
          : <div>
              <p>Please use an Ethereum-enabled browser (like Metamask or Trust Wallet) to use revoke.cash</p>
              <button onClick={() => this.connectWeb3()}>Connect web3</button>
            </div>
        }
        <p>Site created by <a href="https://kalis.me/">Rosco Kalis</a> (<a href="https://github.com/rkalis/revoke.cash">Source</a>)</p>
      </div>
    )
  }
}

export default App
