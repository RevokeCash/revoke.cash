import type { Filter, Log } from 'lib/utils/events';

export interface EventGetter {
  getEvents: (chainId: number, filter: Filter) => Promise<Log[]>;
}
