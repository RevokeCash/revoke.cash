import type { Address } from 'viem';

export interface ScanJobData {
  scanId: string;
  address: Address;
  chainId: number;
  reason: 'scheduled' | 'manual';
  scheduledAt: number;
}

export type EnqueueOutcome = 'added' | 'deduped';

export const SCAN_QUEUE_NAME = 'monitor_scan';
