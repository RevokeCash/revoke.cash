import './App.scss'
import { Signer, providers } from 'ethers'
import React, { Component, ReactNode, ChangeEvent } from 'react'
import { TokenMapping } from './common/interfaces'
import { getFullTokenMapping, isSupportedNetwork } from './common/util'
import Erc20TokenList from './ERC20/Erc20TokenList'

type Props = {
  provider: providers.Provider
  chainId: number,
  signer?: Signer
  signerAddress?: string
  inputAddress?: string
}

type State = {
  filterRegisteredTokens: boolean
  filterZeroBalances: boolean
  loading: boolean
  tokenMapping?: TokenMapping
}

class Dashboard extends Component<Props, State> {
  state: State = {
    filterRegisteredTokens: true,
    filterZeroBalances: true,
    loading: true,
  }

  componentDidMount() {
    this.loadData()
  }

  async loadData() {
    const tokenMapping = await getFullTokenMapping(this.props.chainId)
    this.setState({ tokenMapping, loading: false })
  }

  handleRegisteredCheckboxChange = (event: ChangeEvent<HTMLInputElement>) =>
    this.setState({ filterRegisteredTokens: event.target.checked })

  handleZeroBalancesCheckboxChange = (event: ChangeEvent<HTMLInputElement>) =>
    this.setState({ filterZeroBalances: event.target.checked })

  render(): ReactNode {
    if (!isSupportedNetwork(this.props.chainId)) {
      return (
        <div style={{ paddingBottom: 10 }}>
          Network with chainId {this.props.chainId} is not supported`
        </div>
      )
    }

    return (
      <div className="Dashboard">
        {this.renderRegistrationCheckbox()}
        {this.renderZeroBalancesCheckbox()}
        {this.renderErc20TokenList()}
      </div>
    )
  }

  renderRegistrationCheckbox() {
    // If no token data mapping is found and we're not on ETH, we hide the checkbox
    if (!this.state.tokenMapping && this.props.chainId !== 1) return

    // Link to Kleros T2CR for Ethereum or tokenlists for other chains
    const infoLink = this.props.chainId === 1
      ? 'https://tokens.kleros.io/tokens'
      : 'https://tokenlists.org/'

    return (
      <div>
        Filter out unregistered tokens
        <sup><a href={infoLink} target="_blank" rel="noopener noreferrer">?</a></sup>
        <input type="checkbox" checked={this.state.filterRegisteredTokens} onChange={this.handleRegisteredCheckboxChange} />
      </div>
    )
  }

  renderZeroBalancesCheckbox() {
    return (
      <div>
        <span style={{ marginRight: 5 }}>Filter out zero balances</span>
        <input type="checkbox" checked={this.state.filterZeroBalances} onChange={this.handleZeroBalancesCheckboxChange} />
      </div>
    )
  }

  renderErc20TokenList() {
    if (!this.props.inputAddress || this.state.loading) {
      return null;
    }

    return (
        <Erc20TokenList
          provider={this.props.provider}
          chainId={this.props.chainId}
          signer={this.props.signer}
          signerAddress={this.props.signerAddress}
          inputAddress={this.props.inputAddress}
          filterRegisteredTokens={this.state.filterRegisteredTokens}
          filterZeroBalances={this.state.filterZeroBalances}
          tokenMapping={this.state.tokenMapping}
        />
    );
  }
}

export default Dashboard
