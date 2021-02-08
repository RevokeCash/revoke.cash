import { Contract, BigNumber, providers } from 'ethers'

export interface TokenData {
  contract: Contract
  symbol: string
  decimals: number
  balance: BigNumber
  totalSupply: string
  registered: boolean
  approvals: Array<providers.Log>
}
