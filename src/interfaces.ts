export interface AddressInfo {
  address: string
  ETH: {
      balance: number
      price: PriceInfo
  },
  countTxs: number
  contractInfo?: ContractInfo
  tokenInfo?: TokenInfo
  tokens?: TokenData[]
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

export interface TokenData {
  tokenInfo: TokenInfo
  balance: number
  totalIn?: number
  totalOut?: number
  registered?: boolean
}
