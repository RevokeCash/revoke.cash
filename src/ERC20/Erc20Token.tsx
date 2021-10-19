import { Signer, providers } from 'ethers'
import { getAddress, hexDataSlice } from 'ethers/lib/utils'
import React, { Component, ReactNode } from 'react'
import ClipLoader from 'react-spinners/ClipLoader'
import { Erc20TokenData } from '../common/interfaces'
import { compareBN, toFloat } from '../common/util'
import { formatAllowance } from './util'
import Erc20Allowance from './Erc20Allowance'

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

type Allowance = {
  spender: string
  allowance: string
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
        {this.renderTokenBalance()}
        <div className="AllowanceList">{this.renderAllowanceList()}</div>
      </div>
    )
  }

  renderTokenBalance() {
    const { symbol, balance, decimals } = this.props.token

    const backupImage = (ev) => { (ev.target as HTMLImageElement).src = 'erc20.png'}
    const img = (<img src={this.props.token.icon} alt="" width="20px" onError={backupImage} />)

    return (<div className="TokenBalance my-auto">{img} {symbol}: {toFloat(Number(balance), decimals)}</div>)
  }

  renderAllowanceList() {
    if (this.state.allowances.length === 0) return (<div className="Allowance">No allowances</div>)

    const allowances = this.state.allowances.map((allowance, i) => (
      <Erc20Allowance
        key={i}
        provider={this.props.provider}
        token={this.props.token}
        spender={allowance.spender}
        allowance={allowance.allowance}
        inputAddress={this.props.inputAddress}
        signerAddress={this.props.signerAddress}
        chainId={this.props.chainId}
        onRevoke={() => {
          this.setState({ allowances: this.state.allowances.filter(filteredAllowance => filteredAllowance.spender !== allowance.spender)})
        }}
      />
    ))
    return allowances
  }
}

export default Erc20Token
