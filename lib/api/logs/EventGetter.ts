import type { Filter } from '@ethersproject/abstract-provider';
import type { Log } from 'lib/interfaces';

export interface EventGetter {
  getEvents: (chainId: number, filter: Filter) => Promise<Log[]>;
}
