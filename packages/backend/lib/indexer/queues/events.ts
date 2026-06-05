import type { Address } from 'viem';

export interface EventsJobData {
  eventsScanId: string;
  address: Address;
  chainId: number;
  reason: 'scheduled' | 'manual';
  scheduledAt: number;
}

export type EnqueueOutcome = 'added' | 'deduped';

export const EVENTS_QUEUE_NAME = 'indexer_events';
