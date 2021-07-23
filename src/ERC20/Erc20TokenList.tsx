import { Signer, Contract, providers } from 'ethers'
import { Interface, getAddress, hexZeroPad } from 'ethers/lib/utils'
import React, { Component } from 'react'
import ClipLoader from 'react-spinners/ClipLoader'
import { Erc20TokenData, TokenMapping } from '../common/interfaces'
import Erc20Token from './Erc20Token'
import { isRegistered, getTokenIcon, toFloat } from '../common/util'
import { getTokenData } from './util'
import { ERC20 } from '../common/abis'

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
  tokens: Erc20TokenData[]
  loading: boolean
}

class Erc20TokenList extends Component<Props, State> {
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
        const registered = await isRegistered(contract.address, this.props.provider, this.props.tokenMapping)
        const icon = await getTokenIcon(contract.address, this.props.chainId, this.props.tokenMapping)

        try {
          const tokenData = await getTokenData(contract, this.props.inputAddress, this.props.tokenMapping)
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

    this.setState({ tokens, loading: false })
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
      .filter((token) => !this.props.filterZeroBalances || !(toFloat(Number(token.balance), token.decimals) === '0.000'))
      .map((token) => (
        <Erc20Token
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

export default Erc20TokenList
