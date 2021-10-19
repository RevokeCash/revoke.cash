import React, { Component, ReactNode } from 'react'
import { Button, Form, InputGroup, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { ClipLoader } from 'react-spinners'
import { providers, BigNumber } from 'ethers'
import { formatAllowance } from './util'
import { Erc20TokenData } from '../common/interfaces'
import { addressToAppName, shortenAddress, getDappListName, getExplorerUrl, lookupEnsName, fromFloat } from '../common/util'

type Props = {
  provider: providers.Provider
  spender: string
  allowance: string
  inputAddress: string
  signerAddress: string
  chainId: number
  token: Erc20TokenData
  onRevoke: () => void;
}

type State = {
  newAllowance: string
  loading: boolean
  ensSpender?: string
  spenderAppName?: string
}

class Erc20Allowance extends Component<Props, State> {
  state: State = {
    newAllowance: '0',
    loading: true,
  }

  componentDidMount() {
    this.loadData()
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.spender === prevProps.spender && this.props.allowance === prevProps.allowance) return
    this.loadData()
  }

  private async loadData() {
    if (!this.props.inputAddress) return

    this.setState({ loading: true })

    // Retrieve the spender's ENS name if it exists
    const ensSpender = await lookupEnsName(this.props.spender, this.props.provider)

    // Retrieve the spender's app name if it exists
    const dappListNetworkName = getDappListName(this.props.chainId)
    const spenderAppName = await addressToAppName(this.props.spender, dappListNetworkName)

    this.setState({ ensSpender, spenderAppName, loading: false })
  }

  private async revoke() {
    this.update('0')
  }

  private async update(newAllowance: string) {
    if (!this.props.token) return

    const bnNew = BigNumber.from(fromFloat(newAllowance, this.props.token.decimals))
    const bnOld = BigNumber.from(this.props.allowance)
    const { contract } = this.props.token

    let tx

    // Not all ERC20 contracts allow for simple changes in approval to be made
    // https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
    // So we have to do a few try-catch statements
    // First try calling approve directly, then try increase/decreaseApproval,
    // finally try resetting allowance to 0 and then calling approve with new value
    try {
      console.debug(`Calling contract.approve(${this.props.spender}, ${bnNew.toString()})`)
      tx = await contract.functions.approve(this.props.spender, bnNew)
    } catch (e1) {
      console.debug(`failed, code ${e1.code}`)
      if (e1.code === -32000) {
        try {
          const sub = bnOld.sub(bnNew)
          if (sub.gte(0)) {
            console.debug(`Calling contract.decreaseApproval(${this.props.spender}, ${sub.toString()})`)
            tx = await contract.functions.decreaseApproval(this.props.spender, sub)
          } else {
            console.debug(`Calling contract.increaseApproval(${this.props.spender}, ${sub.abs().toString()})`)
            tx = await contract.functions.increaseApproval(this.props.spender, sub.abs())
          }
        } catch (e2) {
          console.debug(`failed, code ${e2.code}`)
          if (e2.code === -32000) {
            console.debug(`Calling contract.approve(${this.props.spender}, 0)`)
            tx = await contract.functions.approve(this.props.spender, 0)
            console.debug(`Calling contract.approve(${this.props.spender}, ${bnNew.toString()})`)
            tx = await contract.functions.approve(this.props.spender, bnNew)
          }
        }
      }
    }

    if (tx) {
      await tx.wait(1)
      console.debug('Reloading data')

      if (newAllowance === '0') {
        this.props.onRevoke()
      }
    }
  }

  render(): ReactNode {
    if (this.state.loading) {
      return (<div><ClipLoader size={10} color={'#000'} loading={this.state.loading} /></div>)
    }

    return (
      <Form inline className="Allowance" key={this.props.spender}>
        {this.renderAllowanceText()}
        {this.renderRevokeButton()}
        {this.renderUpdateInputGroup()}
      </Form>
    )
  }

  renderAllowanceText() {
    const spender = this.state.spenderAppName || this.state.ensSpender || this.props.spender
    const shortenedSpender = this.state.spenderAppName || this.state.ensSpender || shortenAddress(this.props.spender)

    const explorerBaseUrl = getExplorerUrl(this.props.chainId)

    const shortenedLink = explorerBaseUrl
      ? (<a className="monospace" href={`${explorerBaseUrl}/${this.props.spender}`}>{shortenedSpender}</a>)
      : shortenedSpender

    const regularLink = explorerBaseUrl
      ? (<a className="monospace" href={`${explorerBaseUrl}/${this.props.spender}`}>{spender}</a>)
      : spender

    // Display separate spans for the regular and shortened versions of the spender address
    // The correct one is selected using CSS media-queries
    return (
      <Form.Label className="AllowanceText">
        <span className="AllowanceTextSmallScreen">
          {formatAllowance(this.props.allowance, this.props.token.decimals, this.props.token.totalSupply)} allowance to&nbsp;{shortenedLink}
        </span>

        <span className="AllowanceTextBigScreen">
          {formatAllowance(this.props.allowance, this.props.token.decimals, this.props.token.totalSupply)} allowance to&nbsp;{regularLink}
        </span>
      </Form.Label>
    )
  }

  renderRevokeButton() {
    const canRevoke = this.props.inputAddress === this.props.signerAddress

    let revokeButton = (<Button
      size="sm" disabled={!canRevoke}
      className="RevokeButton"
      onClick={() => this.revoke()}
    >Revoke</Button>)

    // Add tooltip if the button is disabled
    if (!canRevoke) {
      const tooltip = (<Tooltip id={`revoke-tooltip-${this.props.token.contract.address}`}>You can only revoke allowances of the connected account</Tooltip>)
      revokeButton = (<OverlayTrigger overlay={tooltip}><span>{revokeButton}</span></OverlayTrigger>)
    }

    return revokeButton
  }

  renderUpdateInputGroup() {
    const canUpdate = this.props.inputAddress === this.props.signerAddress

    let updateGroup = (<InputGroup size="sm">
      <Form.Control type="text" size="sm"
        className="NewAllowance"
        value={this.state.newAllowance}
        onChange={(event) => {
          this.setState({ newAllowance: event.target.value })
        }}/>
      <InputGroup.Append>
      <Button disabled={!canUpdate} className="UpdateButton" onClick={() => this.update(this.state.newAllowance)}>Update</Button>
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

export default Erc20Allowance
