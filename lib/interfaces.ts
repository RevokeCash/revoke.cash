import type { Log as EthersLog, TransactionResponse } from '@ethersproject/abstract-provider';
import type { Contract, Signer } from 'ethers';

export interface BaseTokenData {
  contract: Contract;
  chainId: number;
  symbol: string;
  owner: string;
  balance: string;
  icon?: string;
  decimals?: number;
  totalSupply?: string;
  supportsPermit?: boolean;
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
  isSpam?: boolean;
}

export interface TokenMapping {
  [chainId: string]: ChainTokenMapping;
}

export interface ChainTokenMapping {
  [index: string]: TokenFromList;
}

export type TokenStandard = 'ERC20' | 'ERC721';

export interface LogsProvider {
  getLogs(filter: Filter): Promise<Array<Log>>;
}

export type StateSetter<T> = React.Dispatch<React.SetStateAction<T | undefined>>;

export interface Log
  extends Pick<
    EthersLog,
    'address' | 'topics' | 'data' | 'transactionHash' | 'blockNumber' | 'transactionIndex' | 'logIndex'
  > {
  timestamp?: number;
}

export interface RateLimit {
  interval: number;
  intervalCap: number;
  timeout?: number;
}

export interface AddressEvents {
  transferFrom: Log[];
  transferTo: Log[];
  approval: Log[];
  approvalForAll: Log[];
}

export interface Filter {
  topics: string[];
  fromBlock: number;
  toBlock: number;
}

export enum TransactionType {
  REVOKE = 'revoke',
  UPDATE = 'update',
  OTHER = 'other',
}

export interface Marketplace {
  name: string;
  logo: string;
  chains: number[];
  cancelSignatures: (signer: Signer) => Promise<TransactionResponse>;
}

export interface ISidebarEntry {
  title: string;
  description?: string;
  path: string;
  children?: ISidebarEntry[];
}

export interface ContentMeta extends Record<string, any> {
  title: string;
  description: string;
  language: string;
  author?: string;
  translator?: string;
}

export interface RawContentFile {
  content: string;
  language: string;
}

export interface ContentFile {
  content: string;
  meta: ContentMeta;
}

export interface BreadcrumbEntry {
  name: string;
  href?: string;
}
