import type { Filter, Log } from 'lib/utils/events';

export interface EventGetter {
  getLatestBlock: (chainId: number) => Promise<number>;
  getEvents: (chainId: number, filter: Filter) => Promise<Log[]>;
}
