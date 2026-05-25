import type { Address } from 'viem';

export interface AllowancesJobData {
  address: Address;
  chainId: number;
  eventsScanId?: string;
}

export const ALLOWANCES_QUEUE_NAME = 'indexer_allowances';
