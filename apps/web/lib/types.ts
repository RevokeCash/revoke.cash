import type { TokenAllowanceData } from '@revoke.cash/core/allowances';
import type { Filter, ResolvedTimeLog } from '@revoke.cash/core/events';
import type { Address, Hash, WalletClient } from 'viem';

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
  lastCancelled?: ResolvedTimeLog;
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

export type OnCancel<T> = (data: T, lastCancelled: ResolvedTimeLog) => Promise<void>;
