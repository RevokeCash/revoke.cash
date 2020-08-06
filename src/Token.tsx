import './App.scss'
import { Contract, Signer } from 'ethers'
import { Provider } from 'ethers/providers'
import { bigNumberify, getAddress, hexZeroPad, hexDataSlice } from 'ethers/utils'
import React, { Component, ReactNode } from 'react'
import ClipLoader from 'react-spinners/ClipLoader';
import { ERC20 } from './abis'
import { TokenData } from './interfaces'
import { compareBN, addressToAppName, shortenAddress } from './util'
import { Button, Form, InputGroup, OverlayTrigger, Tooltip } from 'react-bootstrap'

type TokenProps = {
  provider?: Provider
  signer?: Signer
  token: TokenData
  signerAddress: string
  inputAddress: string
}

type Allowance = {
  spender: string
  ensSpender?: string
  spenderAppName?: string
  allowance: string
  newAllowance: string
}

type TokenState = {
  contract?: Contract
  address: string
  name: string
  symbol: string
  totalSupply: string
  balance: number
  decimals: number
  allowances: Allowance[]
  icon?: string
  loading: boolean
}

class Token extends Component<TokenProps, TokenState> {
  state: TokenState = {
    address: '',
    name: '',
    symbol: '',
    totalSupply: '0',
    balance: 0,
    decimals: 0,
    allowances: [],
    loading: true,
  }

  componentDidMount() {
    this.loadData()
  }

  componentDidUpdate(prevProps: TokenProps) {
    if (this.props.inputAddress === prevProps.inputAddress) return
    this.loadData()
  }

  private async loadData() {
    if (!this.props.token) return
    if (!this.props.inputAddress) return

    const signerOrProvider = this.props.signer || this.props.provider

    const token = this.props.token.tokenInfo
    const contract = new Contract(token.address, ERC20, signerOrProvider)
    const icon = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${getAddress(token.address)}/logo.png`

    // Retrieve all Approval events
    let approvals = await this.props.provider.getLogs({
      fromBlock: 0,
      address: token.address,
      topics: [contract.interface.events.Approval.topic, hexZeroPad(this.props.inputAddress, 32)]
    })

    // Filter out dupplicate spenders
    approvals = approvals
      .filter((approval, i) => i === approvals.findIndex(other => approval.topics[2] === other.topics[2]))

    // Retrieve current allowance for these Approval events
    let allowances: Allowance[] = (await Promise.all(approvals.map(async (ev) => {
      const spender = getAddress(hexDataSlice(ev.topics[2], 12))
      const allowance = bigNumberify(await contract.functions.allowance(this.props.inputAddress, spender)).toString()

      // Filter (almost) zero-value allowances early to save bandwidth
      if (allowance.length < Number(token.decimals) - 3) return undefined

      // Retrieve the spender's ENS name and the spender's App name if they exist
      const ensSpender = await this.props.provider.lookupAddress(spender)
      const spenderAppName = await addressToAppName(spender)

      const newAllowance = '0'

      return { spender, ensSpender, spenderAppName, allowance, newAllowance }
    })))

    // Filter out zero-value allowances and sort from high to low
    allowances = allowances
      .filter(allowance => allowance !== undefined)
      .sort((a, b) => -1 * compareBN(a.allowance, b.allowance))

    this.setState({
      contract,
      address: token.address,
      name: token.name,
      symbol: token.symbol,
      totalSupply: token.totalSupply,
      balance: this.props.token.balance,
      decimals: parseInt(token.decimals),
      allowances,
      icon,
      loading: false,
    })
  }

  private async revoke(allowance: Allowance) {
    this.update({ ...allowance, newAllowance: '0' })
  }

  private async update(allowance: Allowance) {
    if (!this.state.contract) return

    const bnNew = bigNumberify(this.fromFloat(allowance.newAllowance))
    const bnOld = bigNumberify(allowance.allowance)
    const contract = this.state.contract
    let tx

    // Not all ERC20 contracts allow for simple changes in approval to be made
    // https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
    // So we have to do a few try-catch sattements
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
            await tx.wait(1)
            console.debug(`Calling contract.approve(${allowance.spender}, ${bnNew.toString()})`)
            tx = await contract.functions.approve(allowance.spender, bnNew)
          }
        }
      }
    }

    if (tx) await tx.wait(1)
    console.debug('Reloading data')
    this.loadData()
  }

  private toFloat(n: number): string {
    return (n / (10 ** this.state.decimals)).toFixed(3)
  }

  private fromFloat(s: string): string {
    const sides = s.split('.')
    if (sides.length === 1) return s.padEnd(this.state.decimals + s.length, '0')
    if (sides.length > 2) return '0'

    return sides[1].length > this.state.decimals
      ? sides[0] + sides[1].slice(0, this.state.decimals)
      : sides[0] + sides[1].padEnd(this.state.decimals, '0')
  }

  private formatAllowance(allowance: string) {
    const allowanceBN = bigNumberify(allowance)
    const totalSupplyBN = bigNumberify(this.state.totalSupply)
    if (allowanceBN.gt(totalSupplyBN)) {
      return 'Unlimited'
    }
    return this.toFloat(Number(allowanceBN))
  }

  render(): ReactNode {
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
    const backupImage = (ev) => { (ev.target as HTMLImageElement).src = 'erc20.png'}
    const img = (<img src={this.state.icon} alt="" width="20px" onError={backupImage} />)
    return (<div className="TokenBalance my-auto">{img} {this.state.symbol}: {this.toFloat(this.state.balance)}</div>)
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

    // Display separate spans for the regular and shortened versions of the spender address
    // The correct one is selected using CSS media-queries
    return (
      <Form.Label className="AllowanceText">
        <span className="AllowanceTextSmallScreen">
          {this.formatAllowance(allowance.allowance)} allowance to&nbsp;
          <a className="monospace" href={`https://etherscan.io/address/${allowance.spender}`}>{shortenedSpender}</a>
        </span>

        <span className="AllowanceTextBigScreen">
          {this.formatAllowance(allowance.allowance)} allowance to&nbsp;
          <a className="monospace" href={`https://etherscan.io/address/${allowance.spender}`}>{spender}</a>
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
      const tooltip = (<Tooltip id={`revoke-tooltip-${this.state.address}`}>You can only revoke allowances of the connected account</Tooltip>)
      revokeButton = (<OverlayTrigger overlay={tooltip}><span>{revokeButton}</span></OverlayTrigger>)
    }

    return revokeButton;
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
      const tooltip = (<Tooltip id={`update-tooltip-${this.state.address}`}>You can only update allowances of the connected account</Tooltip>)
      updateGroup = (<OverlayTrigger overlay={tooltip}><span>{updateGroup}</span></OverlayTrigger>)
    }

    return updateGroup
  }
}

export default Token
