import { Signer, providers } from 'ethers'
import React, { Component, ReactNode } from 'react'
import ClipLoader from 'react-spinners/ClipLoader'
import { Erc721TokenData } from '../common/interfaces'
import { getExplorerUrl } from '../common/util'
import { addDisplayAddressesToAllowances, getLimitedAllowancesFromApprovals, getUnlimitedAllowancesFromApprovals } from './util'
import { Allowance } from './interfaces'
import Erc721AllowanceList from './Erc721AllowanceList'
import Erc721TokenBalance from './Erc721TokenBalance'

type Props = {
  provider: providers.Provider
  chainId: number
  signer?: Signer
  token: Erc721TokenData
  signerAddress: string
  inputAddress: string
  openSeaProxyAddress?: string
}

type State = {
  allowances: Allowance[]
  icon?: string
  loading: boolean
}

class Erc721Token extends Component<Props, State> {
  state: State = {
    allowances: [],
    loading: true,
  }

  componentDidMount() {
    this.loadData()
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.inputAddress === prevProps.inputAddress) return
    this.loadData()
  }

  private async loadData() {
    if (!this.props.token) return
    if (!this.props.inputAddress) return

    const { token } = this.props

    const unlimitedAllowances = await getUnlimitedAllowancesFromApprovals(token.contract, this.props.inputAddress, token.approvalsForAll)
    const limitedAllowances = await getLimitedAllowancesFromApprovals(token.contract, token.approvals)
    const allAllowances = [...limitedAllowances, ...unlimitedAllowances]
      .filter(allowance => allowance !== undefined)

    const allowances = await addDisplayAddressesToAllowances(allAllowances, this.props.provider, this.props.chainId, this.props.openSeaProxyAddress)

    this.setState({ allowances, loading: false })
  }

  render(): ReactNode {
    const { balance } = this.props.token

    // // Do not render tokens without balance or allowances
    const balanceString = String(balance)
    if (balanceString === '0' && this.state.allowances.length === 0) return null

    return (<div className="Token">{this.renderTokenOrLoading()}</div>)
  }

  renderTokenOrLoading() {
    if (this.state.loading) {
      return (<ClipLoader size={20} color={'#000'} loading={this.state.loading} />)
    }

    return this.renderToken()
  }

  renderToken() {
    const allowanceEquals = (a: Allowance, b: Allowance) => a.spender === b.spender && a.tokenId === b.tokenId
    const explorerUrl = `${getExplorerUrl(this.props.chainId)}/${this.props.token.contract.address}`

    return (
      <div>
        <Erc721TokenBalance
          symbol={this.props.token.symbol}
          icon={this.props.token.icon}
          balance={this.props.token.balance}
          explorerUrl={explorerUrl}
        />
        <Erc721AllowanceList
          token={this.props.token}
          allowances={this.state.allowances}
          inputAddress={this.props.inputAddress}
          signerAddress={this.props.signerAddress}
          chainId={this.props.chainId}
          onRevoke={(allowance: Allowance) => {
            this.setState({ allowances: this.state.allowances.filter(otherAllowance => !allowanceEquals(otherAllowance, allowance))})
          }}
        />
      </div>
    )
  }
}

export default Erc721Token
