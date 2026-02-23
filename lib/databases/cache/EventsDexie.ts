import Dexie, { type Table } from 'dexie';
import type { Log } from 'lib/utils/events';
import type { Address } from 'viem';

export interface Events {
  chainId: number;
  address?: Address;
  topicsKey: string;
  topics: Array<string | null>;
  toBlock: number;
  logs: Log[];
}

export default class EventsDexie extends Dexie {
  public events!: Table<Events>;

  constructor() {
    super('Events');

    // On 2026-02-23, we perform a full re-index of the events table
    this.version(2026_02_23)
      .stores({
        events: '[chainId+topicsKey], chainId, topics, toBlock',
      })
      .upgrade((tx) => {
        tx.table<Events>('events').clear();
      });
  }
}
