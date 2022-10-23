import { Contract, providers } from 'ethers';

export interface Erc20TokenData {
  contract: Contract;
  icon: string;
  symbol: string;
  decimals: number;
  balance: string;
  totalSupply: string;
  verified: boolean;
  approvals: Array<providers.Log>;
}

export interface Erc721TokenData {
  contract: Contract;
  icon: string;
  symbol: string;
  balance: string;
  verified: boolean;
  approvals: Array<providers.Log>;
  approvalsForAll: Array<providers.Log>;
}

export interface TokenFromList {
  chainId: number;
  address: string;
  name: string;
  symbol: string;
  logoURI: string;
  // Only for ERC20
  decimals?: number;
}

export interface TokenMapping {
  [index: string]: TokenFromList;
}

export type TokenStandard = 'ERC20' | 'ERC721';

export interface IERC721Allowance {
  spender: string;
  tokenId?: string;
}

export interface IERC20Allowance {
  spender: string;
  allowance: string;
}

export interface DashboardSettings {
  includeUnverifiedTokens: boolean;
  includeTokensWithoutBalances: boolean;
  includeTokensWithoutAllowances: boolean;
}

export type LogsProvider = Pick<providers.Provider, 'getLogs'>;
