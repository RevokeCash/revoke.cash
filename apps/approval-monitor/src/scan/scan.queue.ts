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

// Note: both removeOnComplete and removeOnFail must remove immediately (`true`), not after a
// retention window, because BullMQ's jobId dedup blocks any add for an existing job in *any* state.
export const SCAN_DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 30_000 },
  removeOnComplete: true,
  removeOnFail: true,
};
