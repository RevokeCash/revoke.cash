import './App.css'
import axios from 'axios'
import { Signer } from 'ethers'
import { Provider } from 'ethers/providers'
import React, { Component, ReactNode, ChangeEvent } from 'react'
import ClipLoader from 'react-spinners/ClipLoader';
import { AddressInfo, TokenData } from './interfaces'
import Token from './Token'
import { isRegistered } from './util'

type TokenListProps = {
  provider?: Provider
  signer?: Signer
}

type TokenListState = {
  address: string
  ensName?: string
  tokens: TokenData[]
  useT2CR: boolean
  loading: boolean
}

class TokenList extends Component<TokenListProps, TokenListState> {
  state: TokenListState = {
    address: '',
    tokens: [],
    useT2CR: true,
    loading: true,
  }

  componentDidMount() {
    this.loadData()
  }

  componentDidUpdate(prevProps: TokenListProps) {
    if (this.props.signer === prevProps.signer) return
    this.loadData()
  }

  async loadData() {
    if (!this.props.signer) return

    // Get address from Metamask
    const address = await this.props.signer.getAddress()
    const ensName = await this.props.provider.lookupAddress(address)

    // Retrieve token balances from the Ethplorer and sort them alphabetically
    const result = await axios.get(`https://api.ethplorer.io/getAddressInfo/${address}?apiKey=freekey`)
    const addressInfo: AddressInfo = result.data

    let tokens = !addressInfo.tokens
      ? []
      : addressInfo.tokens
        .filter(t => t.balance > 0)
        .sort((a: any, b: any) => a.tokenInfo.symbol.localeCompare(b.tokenInfo.symbol))

    tokens = await Promise.all(tokens.map(async token => {
      token.registered = await isRegistered(token.tokenInfo.address, this.props.provider)
      return token
    }))

    this.setState({ tokens, address, ensName, loading: false })
  }

  handleCheckboxChange = (event: ChangeEvent<HTMLInputElement>) =>
    this.setState({ useT2CR: event.target.checked })

  render(): ReactNode {
    return (
      <div className="Dashboard">
        <h4>{this.state.ensName || this.state.address}</h4>
        <p>
          Filter out unregistered tokens
          <sup><a href="https://tokens.kleros.io/tokens" target="_blank" rel="noopener noreferrer">?</a></sup>
          <input type="checkbox" checked={this.state.useT2CR} onChange={this.handleCheckboxChange} />
        </p>
        {this.state.tokens.length > 0
          ? <ul className="TokenList">
            {this.state.tokens.map(t => (
              (!this.state.useT2CR || t.registered) &&
              <Token key={t.tokenInfo.symbol} token={t} provider={this.props.provider} signer={this.props.signer} address={this.state.address} />
            ))
            }
          </ul>
          : (this.state.loading ? <ClipLoader size={40} color={'#000'} loading={this.state.loading} /> : 'No token balances' )
        }
      </div>
    )
  }
}

export default TokenList
