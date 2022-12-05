import type { Provider } from '@ethersproject/abstract-provider';
import type { Contract } from 'ethers';

export interface BaseTokenData {
  contract: Contract;
  symbol: string;
  balance: string;
  icon: string;
  verified: boolean;
  decimals?: number;
  totalSupply?: string;
}

export interface BaseAllowanceData {
  spender: string;
  lastUpdated: number;
  transactionHash: string;
  amount?: string;
  tokenId?: string;
}

export interface AllowanceData extends BaseTokenData {
  spender?: string;
  lastUpdated?: number;
  transactionHash?: string;
  amount?: string;
  tokenId?: string;
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

export interface DashboardSettings {
  includeUnverifiedTokens: boolean;
  includeTokensWithoutBalances: boolean;
  includeTokensWithoutAllowances: boolean;
  tokenStandard: TokenStandard;
}

export type LogsProvider = Pick<Provider, 'getLogs'>;

export type StateSetter<T> = React.Dispatch<React.SetStateAction<T | undefined>>;
