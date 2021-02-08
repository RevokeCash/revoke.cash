import './App.scss'
import axios from 'axios'
import { Signer, Contract, providers } from 'ethers'
import { Interface, getAddress, hexZeroPad } from 'ethers/lib/utils'
import React, { Component, ReactNode, ChangeEvent } from 'react'
import ClipLoader from 'react-spinners/ClipLoader'
import { TokenData } from './interfaces'
import Token from './Token'
import { isRegistered } from './util'
import { ERC20 } from './abis'

type TokenListProps = {
  provider?: providers.Provider
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

    // Look up token data for all tokens, add their list of approvals,
    // and check if the token is registered in Kleros T2CR
    const unsortedTokens = await Promise.all(
      tokenContracts.map(async (contract) => {
        const tokenApprovals = approvals.filter(approval => approval.address === contract.address)
        const registered = await isRegistered(contract.address, this.props.provider)

        try {
          const tokenData = await this.retrieveTokenData(contract)
          return { ...tokenData, contract, registered, approvals: tokenApprovals }
        } catch {
          // If the call to retrieveTokenData() fails, the token is not an ERC20 token so
          // we do not include it in the token list (should not happen).
          return undefined
        }
      })
    )

    // Filter undefined tokens and sort tokens alphabetically on token symbol
    const tokens = unsortedTokens
      .filter((token) => token !== undefined)
      .sort((a: any, b: any) => a.symbol.localeCompare(b.symbol))

    this.setState({ tokens, loading: false })
  }

  async retrieveTokenData(contract: Contract) {
    // Retrieve total supply and user balance from Infura
    const totalSupply = (await contract.functions.totalSupply()).toString()
    const balance = await contract.functions.balanceOf(this.props.inputAddress)

    try {
      // Try to use the public Ethereum token list on GitHub for symbol and decimals info to reduce the number of Infura calls
      const { address } = contract
      const { data } = await axios.get(`https://raw.githubusercontent.com/ethereum-lists/tokens/master/tokens/eth/${address}.json`)
      const { symbol, decimals } = data
      return { symbol, decimals, totalSupply, balance }
    } catch {
      // If the token is not available on the GitHub list, retrieve the info from Infura
      const symbol = await contract.symbol()
      const decimals = await contract.functions.decimals()
      return { symbol, decimals, totalSupply, balance }
    }
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
          key={token.contract.address}
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
