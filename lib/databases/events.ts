import { ChainId } from '@revoke.cash/chains';
import Dexie, { Table } from 'dexie';
import { Filter, Log, LogsProvider } from 'lib/interfaces';
import { getLogs } from 'lib/utils';
import { isCovalentSupportedChain } from 'lib/utils/chains';

interface Events {
  chainId: number;
  topicsKey: string;
  topics: string[];
  toBlock: number;
  logs: Log[];
}

// Certain chains lack proper infrastructure, so we don't index events for them
const DO_NOT_INDEX = [ChainId.PulseChain, ChainId.BitTorrentChainMainnet];

class EventsDB extends Dexie {
  private events!: Table<Events>;

  constructor() {
    super('Events');
    this.version(2023_03_14).stores({
      events: '[chainId+topicsKey], topics, toBlock',
    });

    // Add key for chainId
    this.version(2023_04_10.1).stores({
      events: '[chainId+topicsKey], chainId, topics, toBlock',
    });

    // On 2023-04-10, We moved the "-50" calculation from the backend to the frontend (for flexibility)
    // We need to subtract 50 blocks from the fromBlock and toBlock for Covalent supported chains to make up for this
    this.version(2023_04_10.2).upgrade((tx) => {
      const affectedChains = [1666600000, 4689, 9001, 71402, 288, 592, 336]; // Covalent supported chains (2023-04-10)
      tx.table<Events>('events')
        .where('chainId')
        .anyOf(affectedChains)
        .modify((entry) => {
          entry.toBlock -= 50;
        });
    });
  }

  // Note: It is always assumed that this function is called to get logs for the entire chain (i.e. from block 0 to 'latest')
  // So we assume that the filter.fromBlock is always 0, and we only need to retrieve events between the last stored event and 'latest'
  // This means that we can't use this function to get logs for a specific block range
  async getLogs(logsProvider: LogsProvider, filter: Filter, chainId: number) {
    if (DO_NOT_INDEX.includes(chainId)) return getLogs(logsProvider, filter);

    try {
      const { topics } = filter;
      const topicsKey = topics.join(',');

      // For Covalent supported chains, we need to subtract 50 blocks from the toBlock (due to issues with Covalent)
      const toBlock = isCovalentSupportedChain(chainId) ? Math.max(filter.toBlock - 50, 0) : filter.toBlock;

      const storedEvents = await this.events.get([chainId, topicsKey]);

      // If we already have events stored, we only need to get events from the last stored event to the latest block
      const fromBlock = storedEvents?.toBlock ? storedEvents.toBlock + 1 : filter.fromBlock;

      // If the fromBlock is greater than the toBlock, it means that we already have all the events
      if (fromBlock > toBlock) {
        return storedEvents.logs;
      }

      const newLogs = await getLogs(logsProvider, { ...filter, fromBlock, toBlock });

      const logs = [...(storedEvents?.logs || []), ...newLogs];

      await this.events.put({ chainId, topicsKey, topics, toBlock, logs });

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
