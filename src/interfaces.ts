import { Contract, BigNumber, providers } from 'ethers'

export interface TokenData {
  contract: Contract
  icon: string
  symbol: string
  decimals: number
  balance: BigNumber
  totalSupply: string
  registered: boolean
  approvals: Array<providers.Log>
}

export interface TokenFromList {
  chainId: number
  address: string
  decimals: number
  name: string
  symbol: string
  logoURI: string
}

export interface TokenMapping {
  [index: string]: TokenFromList
}
