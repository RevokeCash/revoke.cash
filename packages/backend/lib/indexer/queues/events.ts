import { toLowercaseAddress } from '@revoke.cash/core/utils';
import type { Address } from 'viem';

export interface EventsJobData {
  eventsScanId: string;
  address: Address;
  chainId: number;
  reason: 'scheduled' | 'manual' | 'auto_revoke';
  scheduledAt: number;
}

export const EVENTS_QUEUE_NAME = 'indexer_events';

export const scheduledEventsJobId = (chainId: number, address: Address): string =>
  `index-events-scheduled-${chainId}-${toLowercaseAddress(address)}`;

export const autoRevokeEventsJobId = (chainId: number, address: Address, actionId: string): string =>
  `index-events-auto-revoke-${chainId}-${toLowercaseAddress(address)}-${actionId}`;

export const exploitEventsJobId = (chainId: number, address: Address): string =>
  `index-events-exploit-${chainId}-${toLowercaseAddress(address)}`;
