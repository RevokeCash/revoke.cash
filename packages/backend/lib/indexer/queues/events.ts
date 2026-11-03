import { toLowercaseAddress } from '@revoke.cash/core/utils';
import type { Address } from 'viem';

export interface EventsJobData {
  eventsScanId: string;
  address: Address;
  chainId: number;
  reason: 'scheduled' | 'catchup' | 'manual' | 'auto_revoke';
  scheduledAt: number;
}

export const EVENTS_QUEUE_NAME = 'indexer_events';

export const scheduledEventsJobId = (chainId: number, address: Address): string =>
  `index-events-scheduled-${chainId}-${toLowercaseAddress(address)}`;

// Keyed on the block the follow-up scan starts from, so each scan still gets its own job
export const catchupEventsJobId = (chainId: number, address: Address, fromBlock: number): string =>
  `index-events-catchup-${chainId}-${toLowercaseAddress(address)}-${fromBlock}`;

export const autoRevokeEventsJobId = (chainId: number, address: Address, actionId: string): string =>
  `index-events-auto-revoke-${chainId}-${toLowercaseAddress(address)}-${actionId}`;
