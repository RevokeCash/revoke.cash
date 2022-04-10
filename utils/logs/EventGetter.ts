import { Filter, Log } from '@ethersproject/abstract-provider'

export interface EventGetter {
  getEvents: (chainId: number, filter: Filter) => Promise<Log[]>;
}
