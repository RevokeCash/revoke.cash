import type { Filter, Log } from 'lib/interfaces';

export interface EventGetter {
  getEvents: (chainId: number, filter: Filter) => Promise<Log[]>;
}
