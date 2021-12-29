import { Signer, providers } from 'ethers'
import React, { Component, ReactNode } from 'react'
import ClipLoader from 'react-spinners/ClipLoader'
import { Erc721TokenData } from '../common/interfaces'
import { getExplorerUrl } from '../common/util'
import { addDisplayAddressesToAllowances, getLimitedAllowancesFromApprovals, getUnlimitedAllowancesFromApprovals } from './util'
import { Allowance } from './interfaces'
import Erc721Allowance from './Erc721Allowance'

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
    return (
      <div>
        {this.renderTokenBalance()}
        <div className="AllowanceList">{this.renderAllowanceList()}</div>
      </div>
    )
  }

  renderTokenBalance() {
    const { symbol, balance, contract } = this.props.token

    const backupImage = (ev) => { (ev.target as HTMLImageElement).src = 'erc721.png'}
    const img = (<img src={this.props.token.icon} alt="" width="20px" onError={backupImage} />)

    const explorerUrl = `${getExplorerUrl(this.props.chainId)}/${contract.address}`

    return (<div className="TokenBalance my-auto"><a href={explorerUrl} style={{ color: 'black' }}>{img} {symbol}: {String(balance)}</a></div>)
  }

  renderAllowanceList() {
    if (this.state.allowances.length === 0) return (<div className="Allowance">No allowances</div>)

    const allowanceEquals = (a: Allowance, b: Allowance) => a.spender === b.spender && a.tokenId === b.tokenId

    const allowances = this.state.allowances.map((allowance, i) => (
      <Erc721Allowance
        token={this.props.token}
        allowance={allowance}
        inputAddress={this.props.inputAddress}
        signerAddress={this.props.signerAddress}
        chainId={this.props.chainId}
        onRevoke={() => {
          this.setState({ allowances: this.state.allowances.filter(otherAllowance => !allowanceEquals(otherAllowance, allowance))})
        }}
      />
    ))
    return allowances
  }
}

export default Erc721Token
