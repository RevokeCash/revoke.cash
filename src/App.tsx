import './App.css';
import React, { Component, ReactNode } from 'react';
import { JsonRpcProvider, Web3Provider } from 'ethers/providers';
import TokenList from './TokenList'

declare let window: any;
declare let web3: any;

type AppState = {
  provider?: JsonRpcProvider
}

class App extends Component<{}, AppState> {
  state: AppState = {}

  async componentDidMount() {
    // Create ethers.js provider from web3 instance injected by Metamask
    try {
      if (window.ethereum) {
        await window.ethereum.enable();
      }
      const provider = new Web3Provider(web3.currentProvider)
      this.setState({ provider })
    } catch {

    }
  }

  render(): ReactNode {
    return (
      <div className="App">
        {this.state.provider
          ? <TokenList provider={this.state.provider} />
          : <p>Please use an Ethereum-enabled browser (like Metamask or Trust Wallet) to use revoke.cash</p>
        }
      </div>
    );
  }
}

export default App;
