import { Signer, providers } from 'ethers'
import { getAddress, hexDataSlice } from 'ethers/lib/utils'
import React, { Component, ReactNode } from 'react'
import ClipLoader from 'react-spinners/ClipLoader'
import { Allowance, Erc20TokenData } from '../common/interfaces'
import { compareBN, toFloat } from '../common/util'
import { formatAllowance } from './util'
import Erc20AllowanceList from './Erc20AllowanceList'
import Erc20TokenBalance from './Erc20TokenBalance'

type Props = {
  provider: providers.Provider
  chainId: number
  signer?: Signer
  token: Erc20TokenData
  signerAddress: string
  inputAddress: string
}

type State = {
  allowances: Allowance[]
  icon?: string
  loading: boolean
}

class Erc20Token extends Component<Props, State> {
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

    // Filter out duplicate spenders
    const approvals = token.approvals
      .filter((approval, i) => i === token.approvals.findIndex(other => approval.topics[2] === other.topics[2]))

    // Retrieve current allowance for these Approval events
    let allowances: Allowance[] = (await Promise.all(approvals.map(async (ev) => {
      const spender = getAddress(hexDataSlice(ev.topics[2], 12))
      const allowance = (await token.contract.functions.allowance(this.props.inputAddress, spender)).toString()

      // Filter (almost) zero-value allowances early to save bandwidth
      if (formatAllowance(allowance, this.props.token.decimals, this.props.token.totalSupply) === '0.000') return undefined

      return { spender, allowance }
    })))

    // Filter out zero-value allowances and sort from high to low
    allowances = allowances
      .filter(allowance => allowance !== undefined)
      .sort((a, b) => -1 * compareBN(a.allowance, b.allowance))

    this.setState({ allowances, loading: false })
  }

  render(): ReactNode {
    const { balance, decimals } = this.props.token

    // Do not render tokens without balance or allowances
    const balanceString = toFloat(Number(balance), decimals)
    if (balanceString === '0.000' && this.state.allowances.length === 0) return null

    return (<div className="Token">{this.renderTokenOrLoading()}</div>)
  }

  renderTokenOrLoading() {
    if (this.state.loading) {
      return (<ClipLoader size={20} color={'#000'} loading={this.state.loading} />)
    }

    return this.renderToken()
  }

  renderToken() {
    return (
      <div>
        <Erc20TokenBalance
          symbol={this.props.token.symbol}
          icon={this.props.token.icon}
          balance={this.props.token.balance}
          decimals={this.props.token.decimals}
        />
        <Erc20AllowanceList
          provider={this.props.provider}
          inputAddress={this.props.inputAddress}
          signerAddress={this.props.signerAddress}
          chainId={this.props.chainId}
          token={this.props.token}
          allowances={this.state.allowances}
          onRevoke={(spender) => {
            this.setState({ allowances: this.state.allowances.filter(allowance => allowance.spender !== spender)})
          }}
        />
      </div>
    )
  }
}

export default Erc20Token
