import './App.css'
import { Contract, Signer } from 'ethers'
import { Provider } from 'ethers/providers'
import { bigNumberify, getAddress, hexZeroPad, hexDataSlice } from 'ethers/utils'
import React, { Component, ReactNode } from 'react'
import { isMobile } from 'react-device-detect'
import ClipLoader from 'react-spinners/ClipLoader';
import { ERC20 } from './abis'
import { TokenData } from './interfaces'
import { compareBN, addressToAppName } from './util'

type TokenProps = {
  provider?: Provider
  signer?: Signer
  token: TokenData
  address: string
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
    if (this.props.signer === prevProps.signer) return
    this.loadData()
  }

  private async loadData() {
    if (!this.props.signer) return
    const token = this.props.token.tokenInfo
    const contract = new Contract(token.address, ERC20, this.props.signer)
    const icon = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${getAddress(token.address)}/logo.png`

    // Retrieve all Approval events
    let approvals = await this.props.provider.getLogs({
      fromBlock: 0,
      address: token.address,
      topics: [contract.interface.events.Approval.topic, hexZeroPad(this.props.address, 32)]
    })

    // Filter out dupplicate spenders
    approvals = approvals
      .filter((approval, i) => i === approvals.findIndex(other => approval.topics[2] === other.topics[2]))

    // Retrieve current allowance for these Approval events
    let allowances: Allowance[] = (await Promise.all(approvals.map(async (ev) => {
      const spender = getAddress(hexDataSlice(ev.topics[2], 12))
      const allowance = bigNumberify(await contract.functions.allowance(this.props.address, spender)).toString()

      // Filter (almost) zero-value allowances early to save bandwidth
      if (allowance.length < Number(token.decimals) - 3) return undefined

      const ensSpender = await this.props.provider.lookupAddress(spender)
      const spenderAppName = await addressToAppName(spender)
      const newAllowance = '0'
      return { spender, ensSpender, spenderAppName, allowance, newAllowance }
    })))

    // Filter out zero-value allowances and sort
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

  private formatAddress(address: string): string {
    return isMobile ? `${address.substr(0, 6)}...${address.substr(address.length - 4, 4)}` : address
  }

  render(): ReactNode {
    return (
      <li className="Token">
        {this.state.loading
          ? <ClipLoader size={20} color={'#000'} loading={this.state.loading} />
          : <div>
            <div className="TokenBalance">
              <img src={this.state.icon} alt="" width="20px"
                  onError={(ev) => { (ev.target as HTMLImageElement).src = 'erc20.png'}} />
              {this.state.symbol}: {this.toFloat(this.state.balance)}
            </div>
            <ul className="AllowanceList">
              {this.state.allowances.length > 0
                ? this.state.allowances.map((allowance, i) => {
                  return (
                    <li key={allowance.spender} className="Allowance">
                      <div className="AllowanceText">
                        {this.formatAllowance(allowance.allowance)} allowance to&nbsp;
                        <a className="monospace" href={`https://etherscan.io/address/${allowance.spender}`}>
                          {allowance.spenderAppName || allowance.ensSpender || this.formatAddress(allowance.spender)}
                        </a>
                        <button className="RevokeButton" onClick={() => this.revoke(allowance)}>Revoke</button>
                        <input type="text"
                              className="NewAllowance"
                              value={this.state.allowances[i].newAllowance}
                              onChange={(event) => {
                                const updatedAllowances = this.state.allowances.slice()
                                updatedAllowances[i] = { ...allowance, newAllowance: event.target.value }
                                this.setState({ allowances: updatedAllowances })
                                }}
                                ></input>
                        <button className="UpdateButton" onClick={() => this.update(allowance)}>Update</button>
                      </div>
                    </li>
                  )
                })
                : <li>No allowances</li>
              }
            </ul>
          </div>
        }
      </li>
    )
  }
}

export default Token
