import './App.scss'
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
  signerAddress?: string
  inputAddress?: string
}

type TokenListState = {
  tokens: TokenData[]
  useT2CR: boolean
  loading: boolean
}

class TokenList extends Component<TokenListProps, TokenListState> {
  state: TokenListState = {
    tokens: [],
    useT2CR: true,
    loading: true,
  }

  componentDidMount() {
    this.loadData()
  }

  componentDidUpdate(prevProps: TokenListProps) {
    if (this.props.inputAddress === prevProps.inputAddress) return
    this.loadData()
  }

  async loadData() {
    if (!this.props.inputAddress) return

    // Reset existing state after update
    this.setState({ tokens: [], loading: true })

    // Retrieve token balances from the Ethplorer API
    const result = await axios.get(`https://api.ethplorer.io/getAddressInfo/${this.props.inputAddress}?apiKey=freekey`)
    const addressInfo: AddressInfo = result.data

    // Return early if no token balances are found
    if (!addressInfo.tokens) {
      this.setState({ loading: false })
      return
    }

    // Sort token balances alphabetically on token symbol
    let tokens = addressInfo.tokens
      .filter(t => t.balance > 0)
      .filter(t => t.tokenInfo.symbol !== undefined)
      .sort((a: any, b: any) => a.tokenInfo.symbol.localeCompare(b.tokenInfo.symbol))

    // Check if tokens are registered in Kleros T2CR
    tokens = await Promise.all(tokens.map(async token => {
      token.registered = await isRegistered(token.tokenInfo.address, this.props.provider)
      return token
    }))

    this.setState({ tokens, loading: false })
  }

  handleCheckboxChange = (event: ChangeEvent<HTMLInputElement>) =>
    this.setState({ useT2CR: event.target.checked })

  render(): ReactNode {
    return (
      <div className="Dashboard">
        {this.renderT2CR()}
        {this.renderTokenList()}
      </div>
    )
  }

  renderT2CR() {
    return (
      <div>
        Filter out unregistered tokens
        <sup><a href="https://tokens.kleros.io/tokens" target="_blank" rel="noopener noreferrer">?</a></sup>
        <input type="checkbox" checked={this.state.useT2CR} onChange={this.handleCheckboxChange} />
      </div>
    )
  }

  renderTokenList() {
    if (this.state.loading) {
      return (<ClipLoader size={40} color={'#000'} loading={this.state.loading} />)
    }

    if (this.state.tokens.length === 0) {
      return (<div className="TokenList">No token balances</div>)
    }

    const tokenComponents = this.state.tokens
      .filter((token) => token.registered || !this.state.useT2CR)
      .map((token) => (
        <Token
          key={token.tokenInfo.address}
          token={token}
          provider={this.props.provider}
          signer={this.props.signer}
          signerAddress={this.props.signerAddress}
          inputAddress={this.props.inputAddress}
        />
      ))

    return (<div className="TokenList">{tokenComponents}</div>)
  }
}

export default TokenList
