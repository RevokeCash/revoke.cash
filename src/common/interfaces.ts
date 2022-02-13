import { Contract, providers } from 'ethers'

export interface Erc20TokenData {
  contract: Contract
  icon: string
  symbol: string
  decimals: number
  balance: string
  totalSupply: string
  registered: boolean
  approvals: Array<providers.Log>
}

export interface Erc721TokenData {
  contract: Contract
  icon: string
  symbol: string
  balance: string
  registered: boolean
  approvals: Array<providers.Log>
  approvalsForAll: Array<providers.Log>
}

export interface TokenFromList {
  chainId: number
  address: string
  name: string
  symbol: string
  logoURI: string
  // Only for ERC20
  decimals?: number
}

export interface TokenMapping {
  [index: string]: TokenFromList
}

export type TokenStandard = 'ERC20' | 'ERC721'
