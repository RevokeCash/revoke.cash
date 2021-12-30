import { Signer, Contract, providers } from 'ethers'
import { Interface, getAddress, hexZeroPad } from 'ethers/lib/utils'
import React, { Component } from 'react'
import ClipLoader from 'react-spinners/ClipLoader'
import { Erc721TokenData, TokenMapping } from '../common/interfaces'
import Erc721Token from './Erc721Token'
import { getTokenIcon } from '../common/util'
import { getOpenSeaProxyAddress, getTokenData } from './util'
import { ERC721Metadata } from '../common/abis'

type Props = {
  provider: providers.Provider
  chainId: number,
  filterRegisteredTokens: boolean
  filterZeroBalances: boolean
  tokenMapping?: TokenMapping
  signer?: Signer
  signerAddress?: string
  inputAddress?: string
}

type State = {
  tokens: Erc721TokenData[]
  loading: boolean
  openSeaProxyAddress?: string
}

class Erc721TokenList extends Component<Props, State> {
  state: State = {
    tokens: [],
    loading: true,
  }

  componentDidMount() {
    this.loadData()
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.inputAddress === prevProps.inputAddress) return
    this.loadData()
  }

  async loadData() {
    if (!this.props.inputAddress) return

    // Reset existing state after update
    this.setState({ tokens: [], loading: true })

    const erc721Interface = new Interface(ERC721Metadata)

    // Get all "approvals for a specific index" made from the input address
    const approvals = await this.props.provider.getLogs({
      fromBlock: 'earliest',
      toBlock: 'latest',
      topics: [erc721Interface.getEventTopic('Approval'), hexZeroPad(this.props.inputAddress, 32)]
    })

    // Get all "approvals for all indexes" made from the input address
    const approvalsForAll = await this.props.provider.getLogs({
      fromBlock: 'earliest',
      toBlock: 'latest',
      topics: [erc721Interface.getEventTopic('ApprovalForAll'), hexZeroPad(this.props.inputAddress, 32)]
    })

    // Get all transfers sent to the input address
    const transfers = await this.props.provider.getLogs({
      fromBlock: 'earliest',
      toBlock: 'latest',
      topics: [erc721Interface.getEventTopic('Transfer'), undefined, hexZeroPad(this.props.inputAddress, 32)]
    })

    const allEvents = [...approvals, ...approvalsForAll, ...transfers];
    console.log(allEvents.length, 'events')

    // Filter unique token contract addresses and convert all events to Contract instances
    const tokenContracts = allEvents
      .filter((event, i) => i === allEvents.findIndex((other) => event.address === other.address))
      .map((event) => new Contract(getAddress(event.address), ERC721Metadata, this.props.provider))

    // Look up token data for all tokens, add their lists of approvals
    const unsortedTokens = await Promise.all(
      tokenContracts.map(async (contract) => {
        const tokenApprovalsForAll = approvalsForAll.filter(approval => approval.address === contract.address)
        const tokenApprovals = approvals.filter(approval => approval.address === contract.address)
        const icon = await getTokenIcon(contract.address, this.props.chainId, this.props.tokenMapping)

        // Skip registration checks for NFTs
        const registered = true

        try {
          const tokenData = await getTokenData(contract, this.props.inputAddress, this.props.tokenMapping)
          return { ...tokenData, icon, contract, registered, approvals: tokenApprovals, approvalsForAll: tokenApprovalsForAll }
        } catch {
          // If the call to getTokenData() fails, the token is not an ERC721 token so
          // we do not include it in the token list.
          return undefined
        }
      })
    )

    // Filter undefined tokens and sort tokens alphabetically on token symbol
    const tokens = unsortedTokens
      .filter((token) => token !== undefined)
      .sort((a: any, b: any) => a.symbol.localeCompare(b.symbol))

    const openSeaProxyAddress = await getOpenSeaProxyAddress(this.props.inputAddress, this.props.provider)

    this.setState({ openSeaProxyAddress, tokens, loading: false })
  }

  render() {
    if (this.state.loading) {
      return (<ClipLoader css="margin-bottom: 10px;" size={40} color={'#000'} loading={this.state.loading} />)
    }

    if (this.state.tokens.length === 0) {
      return (<div className="TokenList">No token balances</div>)
    }

    const tokenComponents = this.state.tokens
      .filter((token) => !this.props.filterRegisteredTokens || token.registered)
      .filter((token) => !this.props.filterZeroBalances || ! (String(token.balance) === '0'))
      .map((token) => (
        <Erc721Token
          key={token.contract.address}
          token={token}
          provider={this.props.provider}
          chainId={this.props.chainId}
          signer={this.props.signer}
          signerAddress={this.props.signerAddress}
          inputAddress={this.props.inputAddress}
          openSeaProxyAddress={this.state.openSeaProxyAddress}
        />
      ))

    // return (<div className="TokenList">Hello</div>)
    return (<div className="TokenList">{tokenComponents}</div>)
  }
}

export default Erc721TokenList
