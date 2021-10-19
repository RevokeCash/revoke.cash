import { Signer, providers, BigNumber } from 'ethers'
import { getAddress, hexDataSlice } from 'ethers/lib/utils'
import React, { Component, ReactNode } from 'react'
import ClipLoader from 'react-spinners/ClipLoader'
import { Erc20TokenData } from '../common/interfaces'
import { compareBN, addressToAppName, shortenAddress, getDappListName, getExplorerUrl, lookupEnsName, toFloat, fromFloat } from '../common/util'
import { Button, Form, InputGroup, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { formatAllowance } from './util'

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
  ensSpender?: string
  spenderAppName?: string
  allowance: string
  newAllowance: string
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

      // Retrieve the spender's ENS name if it exists
      const ensSpender = await lookupEnsName(spender, this.props.provider)

      // Retrieve the spender's app name if it exists
      const dappListNetworkName = getDappListName(this.props.chainId)
      const spenderAppName = await addressToAppName(spender, dappListNetworkName)

      const newAllowance = '0'

      return { spender, ensSpender, spenderAppName, allowance, newAllowance }
    })))

    // Filter out zero-value allowances and sort from high to low
    allowances = allowances
      .filter(allowance => allowance !== undefined)
      .sort((a, b) => -1 * compareBN(a.allowance, b.allowance))

    this.setState({ allowances, loading: false })
  }

  private async revoke(allowance: Allowance) {
    this.update({ ...allowance, newAllowance: '0' })
  }

  private async update(allowance: Allowance) {
    if (!this.props.token) return

    const bnNew = BigNumber.from(fromFloat(allowance.newAllowance, this.props.token.decimals))
    const bnOld = BigNumber.from(allowance.allowance)
    const { contract } = this.props.token

    let tx

    // Not all ERC20 contracts allow for simple changes in approval to be made
    // https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
    // So we have to do a few try-catch statements
    // First try calling approve directly, then try increase/decreaseApproval,
    // finally try resetting allowance to 0 and then calling approve with new value
    try {
      console.debug(`Calling contract.approve(${allowance.spender}, ${bnNew.toString()})`)
      tx = await contract.functions.approve(allowance.spender, bnNew)
    } catch (e1) {
      console.debug(`failed, code ${e1.code}`)
      if (e1.code === -32000) {
        try {
          const sub = bnOld.sub(bnNew)
          if (sub.gte(0)) {
            console.debug(`Calling contract.decreaseApproval(${allowance.spender}, ${sub.toString()})`)
            tx = await contract.functions.decreaseApproval(allowance.spender, sub)
          } else {
            console.debug(`Calling contract.increaseApproval(${allowance.spender}, ${sub.abs().toString()})`)
            tx = await contract.functions.increaseApproval(allowance.spender, sub.abs())
          }
        } catch (e2) {
          console.debug(`failed, code ${e2.code}`)
          if (e2.code === -32000) {
            console.debug(`Calling contract.approve(${allowance.spender}, 0)`)
            tx = await contract.functions.approve(allowance.spender, 0)
            console.debug(`Calling contract.approve(${allowance.spender}, ${bnNew.toString()})`)
            tx = await contract.functions.approve(allowance.spender, bnNew)
          }
        }
      }
    }

    if (tx) {
      await tx.wait(1)

      console.debug('Reloading data')

      const allowances = this.state.allowances.filter(otherAllowance => otherAllowance.spender !== allowance.spender)
      this.setState({ allowances })
    }
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

    const allowances = this.state.allowances.map((allowance, i) => this.renderAllowance(allowance, i))
    return allowances
  }

  renderAllowance(allowance: Allowance, i: number) {
    return (
      <Form inline className="Allowance" key={allowance.spender}>
        {this.renderAllowanceText(allowance)}
        {this.renderRevokeButton(allowance)}
        {this.renderUpdateInputGroup(allowance, i)}
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
          {formatAllowance(allowance.allowance, this.props.token.decimals, this.props.token.totalSupply)} allowance to&nbsp;{shortenedLink}
        </span>

        <span className="AllowanceTextBigScreen">
          {formatAllowance(allowance.allowance, this.props.token.decimals, this.props.token.totalSupply)} allowance to&nbsp;{regularLink}
        </span>
      </Form.Label>
    )
  }

  renderRevokeButton(allowance: Allowance) {
    const canRevoke = this.props.inputAddress === this.props.signerAddress

    let revokeButton = (<Button
      size="sm" disabled={!canRevoke}
      className="RevokeButton"
      onClick={() => this.revoke(allowance)}
    >Revoke</Button>)

    // Add tooltip if the button is disabled
    if (!canRevoke) {
      const tooltip = (<Tooltip id={`revoke-tooltip-${this.props.token.contract.address}`}>You can only revoke allowances of the connected account</Tooltip>)
      revokeButton = (<OverlayTrigger overlay={tooltip}><span>{revokeButton}</span></OverlayTrigger>)
    }

    return revokeButton
  }

  renderUpdateInputGroup(allowance: Allowance, i: number) {
    const canUpdate = this.props.inputAddress === this.props.signerAddress

    let updateGroup = (<InputGroup size="sm">
      <Form.Control type="text" size="sm"
        className="NewAllowance"
        value={this.state.allowances[i].newAllowance}
        onChange={(event) => {
          const updatedAllowances = this.state.allowances.slice()
          updatedAllowances[i] = { ...allowance, newAllowance: event.target.value }
          this.setState({ allowances: updatedAllowances })
        }}/>
      <InputGroup.Append>
      <Button disabled={!canUpdate} className="UpdateButton" onClick={() => this.update(allowance)}>Update</Button>
      </InputGroup.Append>
    </InputGroup>)

    // Add tooltip if the button is disabled
    if (!canUpdate) {
      const tooltip = (<Tooltip id={`update-tooltip-${this.props.token.contract.address}`}>You can only update allowances of the connected account</Tooltip>)
      updateGroup = (<OverlayTrigger overlay={tooltip}><span>{updateGroup}</span></OverlayTrigger>)
    }

    return updateGroup
  }
}

export default Erc20Token
