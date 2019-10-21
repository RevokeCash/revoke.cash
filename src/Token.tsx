import './App.css'
import React, { Component, ReactNode } from 'react'
import { JsonRpcProvider } from 'ethers/providers'
import { ethers, Contract } from 'ethers'
import { ERC20 } from './interfaces'

type TokenProps = {
  provider?: JsonRpcProvider
  token: any
  address: string
}

type TokenState = {
  contract?: Contract
  address: string
  name: string
  symbol: string
  balance: number
  decimals: number
  allowances: string[][]
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

  async loadData() {
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
    let allowances: string[][] = (await Promise.all(approvals.map(async (ev) => {
      const spender = ethers.utils.hexDataSlice(ev.topics[2], 12)
      const allowance = (await contract.functions.allowance(this.props.address, spender) / (10 ** token.decimals)).toFixed(3)
      return [spender, allowance]
    })))

    // Remove duplicates and zero values
    allowances = allowances
      .filter((allowance, i) => i === allowances.findIndex(other => JSON.stringify(allowance) === JSON.stringify(other)))
      .filter(allowance => allowance[1] !== '0.000')

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

  async revoke(spender: string) {
    if (!this.state.contract) return

    // Set allowance to 0
    await this.state.contract.functions.approve(spender, 0)
    this.loadData()
  }

  render(): ReactNode {
    return (
      <li className="Token" style={{textAlign: 'left'}}>
        {this.state.symbol}: {(this.state.balance / (10 ** this.state.decimals)).toFixed(3)}
        {this.state.allowances.length > 0 &&
          <ul>
            {this.state.allowances.map(allowance => {
              return (
                <li key={allowance[0]}>
                  {allowance[1]} allowance to <a href={`https://etherscan.io/address/${allowance[0]}`}>{allowance[0]}</a>
                  <button onClick={() => this.revoke(allowance[0] as string)}>Revoke</button>
                </li>
              )
            })}
          </ul>
        }
      </li>
    )
  }
}

export default Token;
