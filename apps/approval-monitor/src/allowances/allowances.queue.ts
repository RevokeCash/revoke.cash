import type { Address } from 'viem';

export interface AllowancesJobData {
  address: Address;
  chainId: number;
  scanId?: string;
}

export const ALLOWANCES_QUEUE_NAME = 'monitor_allowances';
