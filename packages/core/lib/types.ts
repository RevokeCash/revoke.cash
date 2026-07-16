import type { Address, Hash, TransactionReceipt } from 'viem';

export interface AddressOnChain {
  address: Address;
  chainId: number;
}

export interface RateLimit {
  interval: number;
  intervalCap: number;
  timeout?: number;
}

export interface ConcurrencyLimit {
  concurrency: number;
  timeout?: number;
}

export enum TransactionType {
  REVOKE = 'revoke',
  DELEGATION_REVOKE = 'delegation_revoke',
  UPDATE = 'update',
  SESSION_REVOKE = 'session_revoke',
  FEE = 'fee',
  OTHER = 'other',
}

export interface EtherscanPlatform {
  domain: string;
  subdomain?: string;
}

export type TransactionStatus = 'not_started' | 'preparing' | 'pending' | 'confirmed' | 'reverted' | 'retrying';

export interface TransactionSubmitted {
  hash: Hash;
  confirmation: Promise<TransactionReceipt | undefined>;
}

export type Nullable<T> = T | null;
