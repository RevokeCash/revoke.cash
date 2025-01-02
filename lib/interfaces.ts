import type { Abi, Address, Hash, PublicClient, TransactionReceipt, WalletClient } from 'viem';
import type { TokenAllowanceData } from './utils/allowances';
import type { Filter, TimeLog } from './utils/events';

export interface RateLimit {
  interval: number;
  intervalCap: number;
  timeout?: number;
}

export enum TransactionType {
  REVOKE = 'revoke',
  UPDATE = 'update',
  DONATE = 'donate',
  OTHER = 'other',
}

export interface MarketplaceConfig {
  name: string;
  logo: string;
  chains: number[];
  cancelSignatures: (walletClient: WalletClient) => Promise<Hash>;
  getFilter: (address: Address) => Pick<Filter, 'address' | 'topics'>;
  approvalFilterAddress: Address;
}

export interface Marketplace {
  name: string;
  logo: string;
  chainId: number;
  lastCancelled?: TimeLog;
  cancelSignatures: (walletClient: WalletClient) => Promise<Hash>;
  allowances: TokenAllowanceData[];
}

export interface ISidebarEntry {
  path: string;
  title: string;
  description?: string;
  author?: Person;
  coverImage?: string;
  children?: ISidebarEntry[];
  date?: string;
  readingTime?: number;
}

export interface ContentMeta {
  title: string;
  sidebarTitle?: string;
  description: string;
  language: string;
  author?: Person;
  translator?: Person;
  coverImage?: string;
  date?: string;
  readingTime?: number;
  overlay?: boolean;
}

export interface Person {
  name: string;
  url?: string;
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

export interface SpenderData extends SpenderRiskData {
  name: string;
}

export interface SpenderRiskData {
  name?: string;
  riskFactors?: Nullable<Array<RiskFactor>>;
}

export interface RiskFactor {
  type: string;
  source: string;
  data?: string;
}

export type RiskLevel = 'high' | 'medium' | 'low' | 'unknown';

export interface Contract {
  address: Address;
  abi: Abi;
  publicClient: PublicClient;
}

export interface EtherscanPlatform {
  domain: string;
  subdomain?: string;
}

export type TransactionStatus = 'not_started' | 'pending' | 'confirmed' | 'reverted';

export interface TransactionSubmitted {
  hash: Hash;
  confirmation: Promise<TransactionReceipt | undefined>;
}

export type OnCancel<T> = (data: T, lastCancelled: TimeLog) => Promise<void>;

export type Nullable<T> = T | null;
