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

export type TokenData = Erc20TokenData | Erc721TokenData;
export const isERC721Token = (token: TokenData): token is Erc721TokenData => 'approvalsForAll' in token;
export const isERC20Token = (token: TokenData): token is Erc20TokenData => !isERC721Token(token);

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
  amount: string;
}

export type ITokenAllowance = IERC20Allowance | IERC721Allowance;
export const isERC20Allowance = (allowance: ITokenAllowance): allowance is IERC20Allowance => 'amount' in allowance;
export const isERC721Allowance = (allowance: ITokenAllowance): allowance is IERC721Allowance =>
  !isERC20Allowance(allowance);

export interface DashboardSettings {
  includeUnverifiedTokens: boolean;
  includeTokensWithoutBalances: boolean;
  includeTokensWithoutAllowances: boolean;
  tokenStandard: TokenStandard;
}

export type LogsProvider = Pick<providers.Provider, 'getLogs'>;

export type StateSetter<T> = React.Dispatch<React.SetStateAction<T | undefined>>;
