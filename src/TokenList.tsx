import './App.scss'
import { Signer, Contract, providers } from 'ethers'
import { Interface, getAddress, hexZeroPad } from 'ethers/lib/utils'
import React, { Component, ReactNode, ChangeEvent } from 'react'
import ClipLoader from 'react-spinners/ClipLoader'
import { TokenData, TokenMapping } from './interfaces'
import Token from './Token'
import { getTokenData, getTokenIcon, getTokenMapping, isRegistered, isSupportedNetwork, toFloat } from './util'
import { ERC20 } from './abis'

type TokenListProps = {
  provider: providers.Provider
  chainId: number,
  signer?: Signer
  signerAddress?: string
  inputAddress?: string
}

type TokenListState = {
  tokens: TokenData[]
  filterRegisteredTokens: boolean
  filterZeroBalances: boolean
  loading: boolean
  tokenMapping?: TokenMapping
}

class TokenList extends Component<TokenListProps, TokenListState> {
  state: TokenListState = {
    tokens: [],
    filterRegisteredTokens: true,
    filterZeroBalances: true,
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

    const erc20Interface = new Interface(ERC20)
    const signerOrProvider = this.props.signer || this.props.provider

    // Get all approvals made from the input address
    const approvals = await this.props.provider.getLogs({
      fromBlock: 'earliest',
      toBlock: 'latest',
      topics: [erc20Interface.getEventTopic('Approval'), hexZeroPad(this.props.inputAddress, 32)]
    })

    // Get all transfers sent to the input address
    const transfers = await this.props.provider.getLogs({
      fromBlock: 'earliest',
      toBlock: 'latest',
      topics: [erc20Interface.getEventTopic('Transfer'), undefined, hexZeroPad(this.props.inputAddress, 32)]
    })

    const allEvents = [...approvals, ...transfers];

    // Filter unique token contract addresses and convert all events to Contract instances
    const tokenContracts = allEvents
      .filter((event, i) => i === allEvents.findIndex((other) => event.address === other.address))
      .map((event) => new Contract(getAddress(event.address), ERC20, signerOrProvider))

    // Return early if no tokens are found
    if (tokenContracts.length === 0) {
      this.setState({ loading: false })
      return
    }

    const tokenMapping = await getTokenMapping(this.props.chainId)

    // Look up token data for all tokens, add their list of approvals,
    // and check if the token is registered in Kleros T2CR
    const unsortedTokens = await Promise.all(
      tokenContracts.map(async (contract) => {
        const tokenApprovals = approvals.filter(approval => approval.address === contract.address)
        const registered = await isRegistered(contract.address, this.props.provider, tokenMapping)
        const icon = await getTokenIcon(contract.address, this.props.chainId, tokenMapping)

        try {
          const tokenData = await getTokenData(contract, this.props.inputAddress, tokenMapping)
          return { ...tokenData, icon, contract, registered, approvals: tokenApprovals }
        } catch {
          // If the call to getTokenData() fails, the token is not an ERC20 token so
          // we do not include it in the token list (should not happen).
          return undefined
        }
      })
    )

    // Filter undefined tokens and sort tokens alphabetically on token symbol
    const tokens = unsortedTokens
      .filter((token) => token !== undefined)
      .sort((a: any, b: any) => a.symbol.localeCompare(b.symbol))

    this.setState({ tokens, tokenMapping, loading: false })
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
        {this.renderTokenList()}
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

  renderTokenList() {
    if (this.state.loading) {
      return (<ClipLoader css="margin-bottom: 10px;" size={40} color={'#000'} loading={this.state.loading} />)
    }

    if (this.state.tokens.length === 0) {
      return (<div className="TokenList">No token balances</div>)
    }

    const tokenComponents = this.state.tokens
      .filter((token) => !this.state.filterRegisteredTokens || token.registered)
      .filter((token) => !this.state.filterZeroBalances || !(toFloat(Number(token.balance), token.decimals) === '0.000'))
      .map((token) => (
        <Token
          key={token.contract.address}
          token={token}
          provider={this.props.provider}
          chainId={this.props.chainId}
          signer={this.props.signer}
          signerAddress={this.props.signerAddress}
          inputAddress={this.props.inputAddress}
        />
      ))

    return (<div className="TokenList">{tokenComponents}</div>)
  }
}

export default TokenList
