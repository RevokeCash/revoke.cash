import './App.css'
import React, { Component, ReactNode } from 'react'
import { JsonRpcProvider } from 'ethers/providers'
import { ethers, Contract } from 'ethers'
import { ERC20 } from './abis'
import { TokenData } from './interfaces'
import { compareBN } from './util'

type TokenProps = {
  provider?: JsonRpcProvider
  token: TokenData
  address: string
}

type Allowance = {
  spender: string
  ensSpender?: string
  allowance: string
  newAllowance: string
}

type TokenState = {
  contract?: Contract
  address: string
  name: string
  symbol: string
  balance: number
  decimals: number
  allowances: Allowance[]
}

class Token extends Component<TokenProps, TokenState> {
  state: TokenState = {
    address: '',
    name: '',
    symbol: '',
    balance: 0,
    decimals: 0,
    allowances: []
  }

  componentDidMount() {
    this.loadData()
  }

  componentDidUpdate(prevProps: TokenProps) {
    if (this.props.provider === prevProps.provider) return
    this.loadData()
  }

  private async loadData() {
    if (!this.props.provider) return

    const token = this.props.token.tokenInfo
    const contract = new Contract(token.address, ERC20, this.props.provider.getSigner())

    // Retrieve all Approval events
    const approvals = await this.props.provider.getLogs({
      fromBlock: 0,
      address: token.address,
      topics: [contract.interface.events.Approval.topic, ethers.utils.hexZeroPad(this.props.address, 32)]
    })

    // Retrieve allowance values for all Approval events
    let allowances: Allowance[] = (await Promise.all(approvals.map(async (ev) => {
      const spender = ethers.utils.hexDataSlice(ev.topics[2], 12)
      const ensSpender = await this.props.provider.lookupAddress(spender)
      const allowance = ethers.utils.bigNumberify(await contract.functions.allowance(this.props.address, spender)).toString()
      const newAllowance = '0'
      return { spender, ensSpender, allowance, newAllowance }
    })))

    // Remove duplicates and zero values
    allowances = allowances
      .filter((allowance, i) => i === allowances.findIndex(other => JSON.stringify(allowance) === JSON.stringify(other)))
      .filter(allowance => allowance.allowance !== '0')
      .sort((a, b) => -1 * compareBN(a.allowance, b.allowance))

    this.setState({
      contract,
      address: token.address,
      name: token.name,
      symbol: token.symbol,
      balance: this.props.token.balance,
      decimals: parseInt(token.decimals),
      allowances
    })
  }

  private async revoke(allowance: Allowance) {
    this.update({ ...allowance, newAllowance: '0' })
  }

  private async update(allowance: Allowance) {
    if (!this.state.contract) return

    const bnNew = ethers.utils.bigNumberify(this.fromFloat(allowance.newAllowance))
    const bnOld = ethers.utils.bigNumberify(allowance.allowance)
    let tx

    // Not all ERC20 contracts allow for simple changes in approval to be made
    // https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
    // So we have to do a few try-catch sattements
    // First try calling approve directly, then try increase/decreaseApproval,
    // finally try resetting allowance to 0 and then calling approve with new value
    try {
      console.debug(`Calling contract.approve(${allowance.spender}, ${bnNew.toString()})`)
      tx = await this.state.contract.functions.approve(allowance.spender, bnNew)
    } catch (e1) {
      console.debug(`failed, code ${e1.code}`)
      if (e1.code === -32000) {
        try {
          const sub = bnOld.sub(bnNew)
          if (sub.gte(0)) {
            console.debug(`Calling contract.decreaseApproval(${allowance.spender}, ${sub.toString()})`)
            tx = await this.state.contract.functions.decreaseApproval(allowance.spender, sub)
          } else {
            console.debug(`Calling contract.increaseApproval(${allowance.spender}, ${sub.abs().toString()})`)
            tx = await this.state.contract.functions.increaseApproval(allowance.spender, sub.abs())
          }
        } catch (e2) {
          console.debug(`failed, code ${e2.code}`)
          if (e2.code === -32000) {
            console.debug(`Calling contract.approve(${allowance.spender}, 0)`)
            tx = await this.state.contract.functions.approve(allowance.spender, 0)
            await tx.wait(1)
            console.debug(`Calling contract.approve(${allowance.spender}, ${bnNew.toString()})`)
            tx = await this.state.contract.functions.approve(allowance.spender, bnNew)
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

  render(): ReactNode {
    return (
      <li className="Token">
        {this.state.symbol}: {this.toFloat(this.state.balance)}
        {this.state.allowances.length > 0 &&
          <ul>
            {this.state.allowances.map((allowance, i) => {
              return (
                <li key={allowance.spender}>
                  {this.toFloat(Number(allowance.allowance))} allowance to&nbsp
                  <a href={`https://etherscan.io/address/${allowance.spender}`}>{allowance.ensSpender || allowance.spender}</a>
                  <button onClick={() => this.revoke(allowance)}>Revoke</button>
                  <input type="text"
                         value={this.state.allowances[i].newAllowance}
                         onChange={(event) => {
                           const updatedAllowances = this.state.allowances.slice()
                           updatedAllowances[i] = { ...allowance, newAllowance: event.target.value }
                           this.setState({ allowances: updatedAllowances })
                         }}
                  ></input>
                  <button onClick={() => this.update(allowance)}>Update</button>
                </li>
              )
            })}
          </ul>
        }
      </li>
    )
  }
}

export default Token
