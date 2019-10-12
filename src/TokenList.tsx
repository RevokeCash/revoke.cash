import './App.css'
import React, { Component, ReactNode } from 'react'
import { JsonRpcProvider } from 'ethers/providers'
import axios from 'axios'
import Token from './Token'

type TokenListProps = {
  provider?: JsonRpcProvider
}

type TokenListState = {
  address: string
  tokens: any[]
}

class TokenList extends Component<TokenListProps, TokenListState> {
  state: TokenListState = {
    address: '0x0000000000000000000000000000000000000000',
    tokens: [],
  }

  componentDidMount() {
    this.loadData()
  }

  componentDidUpdate(prevProps: TokenListProps) {
    if (this.props.provider === prevProps.provider) return
    this.loadData()
  }

  async loadData() {
    if (!this.props.provider) return

    // Get address from Metamask
    const address = (await this.props.provider.listAccounts())[0]

    // Retrieve token balances from the Ethplorer and sort them alphabetically
    const { data: addressInfo } = await axios.get(`http://api.ethplorer.io/getAddressInfo/${address}?apiKey=freekey`)
    const tokens = addressInfo.tokens.sort((a: any, b: any) => a.tokenInfo.symbol.localeCompare(b.tokenInfo.symbol))

    this.setState({ tokens, address })
  }

  render(): ReactNode {
    return (
      <div className="TokenList">
        <ul>
          {this.state.tokens.map(t => <Token key={t.tokenInfo.symbol} token={t} provider={this.props.provider} address={this.state.address}/>)}
        </ul>
      </div>
    )
  }
}

export default TokenList;
