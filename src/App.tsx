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

  componentDidMount() {
    // Connect web3 if modern Metamask access is already granted or if older Metamask is used
    // Don't connect if access has not been granted yet
    if (window.ethereum) {
      if (window.ethereum.selectedAddress) {
        this.setState({ provider: new Web3Provider(web3.currentProvider) })
      }
    } else if (window.web3) {
      this.setState({ provider: new Web3Provider(web3.currentProvider) })
    }
  }

  async connectWeb3() {
    try {
      if (window.ethereum) {
        await window.ethereum.enable();
      }
      const provider = new Web3Provider(web3.currentProvider)
      this.setState({ provider })
    } catch(e) {
      console.log(e)
    }
  }

  render(): ReactNode {
    return (
      <div className="App">
        {this.state.provider
          ? <TokenList provider={this.state.provider} />
          : <div>
              <p>Please use an Ethereum-enabled browser (like Metamask or Trust Wallet) to use revoke.cash</p>
              <button onClick={() => this.connectWeb3()}>Connect web3</button>
            </div>
        }
      </div>
    );
  }
}

export default App;
