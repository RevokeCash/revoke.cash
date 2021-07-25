import { Signer, providers, BigNumber } from 'ethers'
import { getAddress, hexDataSlice } from 'ethers/lib/utils'
import React, { Component, ReactNode } from 'react'
import ClipLoader from 'react-spinners/ClipLoader'
import { Erc721TokenData } from '../common/interfaces'
import { shortenAddress, getDappListName, getExplorerUrl, lookupEnsName } from '../common/util'
import { Button, Form, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { ADDRESS_ZERO } from '../common/constants'
import { addressToAppName } from './util'

// TODO: Retrieve OpenSea proxy address for the current user and display it as OpenSea
// TODO: Detect OpenSea Shared Storefront NFTs

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

type Allowance = {
  spender: string
  ensSpender?: string
  spenderAppName?: string
  index?: BigNumber
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

    // Filter out duplicate indices
    const approvals = token.approvals
      .filter((approval, i) => i === token.approvals.findIndex(other => approval.topics[3] === other.topics[3]))

    // Filter out duplicate spenders
    const approvalsForAll = token.approvalsForAll
      .filter((approval, i) => i === token.approvalsForAll.findIndex(other => approval.topics[2] === other.topics[2]))

    // Retrieve current allowance for these ApprovalForAll events
    const unlimitedAllowances: Allowance[] = (await Promise.all(approvalsForAll.map(async (ev) => {
      const spender = getAddress(hexDataSlice(ev.topics[2], 12))

      const [isApprovedForAll] = await token.contract.functions.isApprovedForAll(this.props.inputAddress, spender)
      if (!isApprovedForAll) return undefined

      // Retrieve the spender's ENS name if it exists
      const ensSpender = await lookupEnsName(spender, this.props.provider)

      // Retrieve the spender's app name if it exists
      const dappListNetworkName = getDappListName(this.props.chainId)
      const spenderAppName = await addressToAppName(spender, dappListNetworkName, this.props.openSeaProxyAddress)

      return { spender, ensSpender, spenderAppName }
    })))

    // Retrieve current allowance for these Approval events
    const limitedAllowances: Allowance[] = (await Promise.all(approvals.map(async (ev) => {
      // Wrap this in a try-catch since it's possible the NFT has been burned
      try {
        // Some contracts (like CryptoStrikers) may not implement ERC721 correctly
        // by making tokenId a non-indexed parameter, in which case it needs to be
        // taken from the event data rather than topics
        const index = ev.topics.length === 4
          ? BigNumber.from(ev.topics[3])
          : BigNumber.from(ev.data)

        const [spender] = await token.contract.functions.getApproved(index)
        if (spender === ADDRESS_ZERO) return undefined

        // Retrieve the spender's ENS name if it exists
        const ensSpender = await lookupEnsName(spender, this.props.provider)

        // Retrieve the spender's app name if it exists
        const dappListNetworkName = getDappListName(this.props.chainId)
        const spenderAppName = await addressToAppName(spender, dappListNetworkName, this.props.openSeaProxyAddress)

        return { spender, ensSpender, spenderAppName, index }
      } catch {
        return undefined
      }
    })))

    // Filter out undefined allowances
    // TODO: Sort by index
    const allowances = [...limitedAllowances, ...unlimitedAllowances]
      .filter(allowance => allowance !== undefined)

    this.setState({ allowances, loading: false })
  }

  private async revoke(allowance: Allowance) {
    if (!this.props.token) return

    const { contract } = this.props.token

    let tx

    if (allowance.index === undefined) {
      tx = await contract.functions.setApprovalForAll(allowance.spender, false)
    } else {
      tx = await contract.functions.approve(ADDRESS_ZERO, allowance.index)
    }

    if (tx) {
      await tx.wait(1)

      console.debug('Reloading data')

      const allowanceEquals = (a: Allowance, b: Allowance) => {
        if (a.spender !== b.spender) return false
        if (a.index === undefined && b.index === undefined) return true
        return String(a.index) === String(b.index)
      }

      const allowances = this.state.allowances
        .filter(otherAllowance => !allowanceEquals(otherAllowance, allowance))

      this.setState({ allowances })
    }
  }

  private formatAllowance(index?: BigNumber) {
    if (!index) return 'all tokens'
    return `token ID ${index.toNumber().toFixed(0)}`
  }

  render(): ReactNode {
    const { balance } = this.props.token

    // // Do not render tokens without balance or allowances
    const balanceString = Number(balance).toFixed(0)
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

    return (<div className="TokenBalance my-auto"><a href={explorerUrl} style={{ color: 'black' }}>{img} {symbol}: {Number(balance).toFixed(0)}</a></div>)
  }

  renderAllowanceList() {
    if (this.state.allowances.length === 0) return (<div className="Allowance">No allowances</div>)

    const allowances = this.state.allowances.map((allowance, i) => this.renderAllowance(allowance, i))
    return allowances
  }

  renderAllowance(allowance: Allowance, i: number) {
    return (
      <Form inline className="Allowance" key={allowance.spender}>
        {this.renderAllowanceText(allowance)}
        {this.renderRevokeButton(allowance)}
      </Form>
    )
  }

  renderAllowanceText(allowance: Allowance) {
    const spender = allowance.spenderAppName || allowance.ensSpender || allowance.spender
    const shortenedSpender = allowance.spenderAppName || allowance.ensSpender || shortenAddress(allowance.spender)

    const explorerBaseUrl = getExplorerUrl(this.props.chainId)

    const shortenedLink = explorerBaseUrl
      ? (<a className="monospace" href={`${explorerBaseUrl}/${allowance.spender}`}>{shortenedSpender}</a>)
      : shortenedSpender

    const regularLink = explorerBaseUrl
      ? (<a className="monospace" href={`${explorerBaseUrl}/${allowance.spender}`}>{spender}</a>)
      : spender

    // Display separate spans for the regular and shortened versions of the spender address
    // The correct one is selected using CSS media-queries
    return (
      <Form.Label className="AllowanceText">
        <span className="AllowanceTextSmallScreen">
          Allowance for {this.formatAllowance(allowance.index)} to&nbsp;{shortenedLink}
        </span>

        <span className="AllowanceTextBigScreen">
          Allowance for {this.formatAllowance(allowance.index)} to&nbsp;{regularLink}
        </span>
      </Form.Label>
    )
  }

  renderRevokeButton(allowance: Allowance) {
    const canRevoke = this.props.inputAddress === this.props.signerAddress

    let revokeButton = (
      <Button
        size="sm" disabled={!canRevoke}
        className="RevokeButton"
        onClick={() => this.revoke(allowance)}
      >
        Revoke
      </Button>
    )

    // Add tooltip if the button is disabled
    if (!canRevoke) {
      const tooltip = (<Tooltip id={`revoke-tooltip-${this.props.token.contract.address}`}>You can only revoke allowances of the connected account</Tooltip>)
      revokeButton = (<OverlayTrigger overlay={tooltip}><span>{revokeButton}</span></OverlayTrigger>)
    }

    return revokeButton
  }
}

export default Erc721Token
