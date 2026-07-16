import type { Filter, Log } from '@revoke.cash/core/events';

export interface EventGetter {
  getLatestBlock: (chainId: number) => Promise<number>;
  getEvents: (chainId: number, filter: Filter) => Promise<Log[]>;
}
