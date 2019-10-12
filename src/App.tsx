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
    if (window.ethereum) {
      await window.ethereum.enable();
    }
    const provider = new Web3Provider(web3.currentProvider)
    this.setState({ provider })
  }

  render(): ReactNode {
    return (
      <div className="App">
        <TokenList provider={this.state.provider} />
      </div>
    );
  }
}

export default App;
