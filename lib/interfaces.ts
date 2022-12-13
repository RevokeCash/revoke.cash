import type { Log as EthersLog, Provider } from '@ethersproject/abstract-provider';
import type { Contract } from 'ethers';

export interface BaseTokenData {
  contract: Contract;
  symbol: string;
  balance: string;
  icon: string;
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
  symbol: string;
  decimals?: number;
  logoURI?: string;
}

export interface TokenMapping {
  [chainId: string]: ChainTokenMapping;
}

export interface ChainTokenMapping {
  [index: string]: TokenFromList;
}

export type TokenStandard = 'ERC20' | 'ERC721';

export type LogsProvider = Pick<Provider, 'getLogs'>;

export type StateSetter<T> = React.Dispatch<React.SetStateAction<T | undefined>>;

export interface Log extends EthersLog {
  timestamp?: number;
}
