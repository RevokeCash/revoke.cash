import { Contract } from 'ethers';
import { Log } from 'ethers/providers';
import { BigNumber } from 'ethers/utils';

export interface AddressInfo {
  address: string
  ETH: {
      balance: number
      price: PriceInfo
  },
  countTxs: number
  contractInfo?: ContractInfo
  tokenInfo?: TokenInfo
  tokens?: EthplorerTokenData[]
}

export interface PriceInfo {
  rate: number
  currency: string
  diff: number
  diff7d: number
  diff30d: number
  marketCapUsd: string
  availableSupply: string
  volume24h: string
  ts: number
}

export interface ContractInfo  {
  creatorAddress: string
  transactionHash: string
  timestamp: number
}

export interface TokenInfo {
  address: string
  totalSupply: string
  name: string
  symbol: string
  decimals: string
  price: PriceInfo
  owner: string
  countOps: number
  totalIn: number
  totalOut: number
  transfersCount: number
  ethTransfersCount?: number
  holdersCount: number
  issuancesCount: number
  image?: string
  description?: string
  website?: string
  lastUpdated: number
}

export interface EthplorerTokenData {
  tokenInfo: TokenInfo
  balance: number
  totalIn?: number
  totalOut?: number
}

export interface TokenData {
  contract: Contract
  symbol: string
  decimals: number
  balance: BigNumber
  totalSupply: string
  registered: boolean
  approvals: Array<Log>
}
