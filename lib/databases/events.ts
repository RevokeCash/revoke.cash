import { ChainId } from '@revoke.cash/chains';
import Dexie, { type Table } from 'dexie';
import type { LogsProvider } from 'lib/providers';
import { getChainName } from 'lib/utils/chains';
import type { Filter, Log } from 'lib/utils/events';
import type { Address } from 'viem';

interface Events {
  chainId: number;
  address?: Address;
  topicsKey: string;
  topics: Array<string | null>;
  toBlock: number;
  logs: Log[];
}

// Certain chains lack proper infrastructure, so we don't index events for them
// Note: these are prime candidates for delisting from the app if no long term solutions are found
const DO_NOT_INDEX = [ChainId.PulseChain, ChainId.BitTorrentChainMainnet, 999];

class EventsDB extends Dexie {
  private events!: Table<Events>;

  constructor() {
    super('Events');

    // On 2024-11-28, we found a bug with the formatting of specific events, which requires a full re-index of all events.
    // Because this is a full re-index, we removed previous database migrations since those are no longer relevant.
    this.version(2024_11_28)
      .stores({
        events: '[chainId+topicsKey], chainId, topics, toBlock',
      })
      .upgrade((tx) => {
        tx.table<Events>('events').clear();
      });
  }

  // Note: It is always assumed that this function is called to get logs for the entire chain (i.e. from block 0 to 'latest')
  // So we assume that the filter.fromBlock is always 0, and we only need to retrieve events between the last stored event and 'latest'
  // This means that we can't use this function to get logs for a specific block range
  async getLogs(logsProvider: LogsProvider, filter: Filter, chainId: number, nameTag?: string): Promise<Log[]> {
    const logs = await this.getLogsInternal(logsProvider, filter, chainId);

    if (nameTag) console.log(`${getChainName(chainId)}: ${nameTag} logs`, logs);
    // We can uncomment this to filter the logs once more by block number after retrieving them from IndexedDB
    // This is useful when we want to test the state of approvals at a different block by using a Tenderly fork
    // return logs.filter((log) => log.blockNumber >= filter.fromBlock && log.blockNumber <= filter.toBlock);
    return logs;
  }

  private async getLogsInternal(logsProvider: LogsProvider, filter: Filter, chainId: number): Promise<Log[]> {
    const toBlock = filter.toBlock;

    if (DO_NOT_INDEX.includes(chainId)) return logsProvider.getLogs({ ...filter, toBlock });

    try {
      // We add the filter address to topicsKey because we cannot update the primary key of the table in Dexie (yet),
      // so this is the only backwards-compatible way to add the address to the primary key. Note that this causes
      // no change for filters without address because we don't change the topicsKey for those.
      // TODO: Properly update the primary key of the table in Dexie when it is supported.
      const { address, topics } = filter;
      const topicsKey = topics.join(',') + (address ? `/${address}` : '');
      const storedEvents = await this.events.get([chainId, topicsKey]);

      // If we already have events stored, we only need to get events from the last stored event to the latest block
      const fromBlock = storedEvents?.toBlock ? storedEvents.toBlock + 1 : filter.fromBlock;

      // If the fromBlock is greater than the toBlock, it means that we already have all the events
      if (fromBlock > toBlock) {
        return storedEvents!.logs.filter(
          (log) => log.blockNumber >= filter.fromBlock && log.blockNumber <= filter.toBlock,
        );
      }
      const newLogs = await logsProvider.getLogs({ ...filter, fromBlock, toBlock });

      const logs = [...(storedEvents?.logs || []), ...newLogs];

      await this.events.put({ chainId, address, topicsKey, topics, toBlock, logs });
      return logs;
    } catch (e) {
      console.error(e);
      // If there is an error, we just return the logs from the provider (may be the case if IndexedDB is not supported)
      if (e instanceof Dexie.DexieError) {
        return logsProvider.getLogs(filter);
      }

      // Covalent can have issues with keeping up with the chain, so if we cannot find the block, we try again with a smaller toBlock
      if (e instanceof Error && e.message.includes('Requested block range is out of bounds')) {
        const latestKnownBlock = Number(e.message.match(/\d+ > (\d+)/)?.[1]);
        if (latestKnownBlock) {
          return this.getLogsInternal(logsProvider, { ...filter, toBlock: latestKnownBlock }, chainId);
        }
      }

      throw e;
    }
  }
}

const eventsDB = new EventsDB();

export default eventsDB;
