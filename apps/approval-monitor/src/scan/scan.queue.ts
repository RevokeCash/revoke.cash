import type { Address } from 'viem';

export interface ScanJobData {
  scanId: string;
  address: Address;
  chainId: number;
  reason: 'scheduled' | 'manual';
  scheduledAt: number;
}

export type EnqueueOutcome = 'added' | 'deduped' | 'no_queue';

export const scanQueueNameForChain = (chainId: number): string => `monitor_scan_${chainId}`;
