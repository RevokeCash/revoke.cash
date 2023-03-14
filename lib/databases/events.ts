import Dexie, { Table } from 'dexie';
import { Filter, Log, LogsProvider } from 'lib/interfaces';
import { getLogs } from 'lib/utils';

interface Events {
  id: string;
  chainId: number;
  topics: string[];
  toBlock: number;
  logs: Log[];
}

class EventsDB extends Dexie {
  private events!: Table<Events>;

  constructor() {
    super('Events');
    this.version(2023_03_14).stores({
      events: 'id, chainId, *topics, toBlock',
    });

    // We can use this method to force clear the events table if we need to
    // this.version(2023_03_15).upgrade(() => {
    //   this.events.clear();
    // });
  }

  private getId(chainId: number, filter: Filter) {
    return JSON.stringify({ chainId, topics: filter.topics });
  }

  // Note: It is always assumed that this function is called to get logs for the entire chain (i.e. from block 0 to 'latest')
  // So we assume that the filter.fromBlock is always 0, and we only need to retrieve events between the last stored event and 'latest'
  // This means that we can't use this function to get logs for a specific block range
  async getLogs(logsProvider: LogsProvider, filter: Filter, chainId: number) {
    try {
      const id = this.getId(chainId, filter);
      const { topics, toBlock } = filter;

      const storedEvents = await this.events.get(id);

      // If we already have events stored, we only need to get events from the last stored event to the latest block
      const fromBlock = storedEvents?.toBlock ? storedEvents.toBlock + 1 : filter.fromBlock;

      // If the fromBlock is greater than the toBlock, it means that we already have all the events
      if (fromBlock > toBlock) {
        return storedEvents.logs;
      }

      const newLogs = await getLogs(logsProvider, { ...filter, fromBlock, toBlock });

      const logs = [...(storedEvents?.logs || []), ...newLogs];

      await this.events.put({ id, chainId, topics, toBlock, logs });

      return logs;
    } catch (e) {
      console.log(e);
      // If there is an error, we just return the logs from the provider (may be the case if IndexedDB is not supported)
      if (e instanceof Dexie.DexieError) {
        return getLogs(logsProvider, filter);
      }

      throw e;
    }
  }
}

const eventsDB = new EventsDB();

export default eventsDB;
