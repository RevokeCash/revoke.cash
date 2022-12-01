import type { Log, Provider } from '@ethersproject/abstract-provider';
import type { Contract } from 'ethers';

export interface BaseTokenData {
  symbol: string;
  balance: string;
  icon: string;
  verified: boolean;
  decimals?: number;
  totalSupply?: string;
}

export interface AllowanceData extends BaseTokenData {
  contract: Contract;
  spender?: string;
  amount?: string;
  tokenId?: string;
}

export interface Erc20TokenData {
  contract: Contract;
  icon: string;
  symbol: string;
  decimals: number;
  balance: string;
  totalSupply: string;
  verified: boolean;
  approvals: Array<Log>;
}

export interface Erc721TokenData {
  contract: Contract;
  icon: string;
  symbol: string;
  balance: string;
  verified: boolean;
  approvals: Array<Log>;
  approvalsForAll: Array<Log>;
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

export type LogsProvider = Pick<Provider, 'getLogs'>;

export type StateSetter<T> = React.Dispatch<React.SetStateAction<T | undefined>>;
