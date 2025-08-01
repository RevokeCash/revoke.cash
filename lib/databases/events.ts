import { ChainId } from '@revoke.cash/chains';
import type { LogsProvider } from 'lib/providers';
import { isBrowser } from 'lib/utils';
import { getChainName } from 'lib/utils/chains';
import type { Filter, Log } from 'lib/utils/events';
import type { Events } from './cache/EventsDexie';
import EventsDexieCache from './cache/EventsDexieCache';
import { CacheError, type ICache } from './cache/ICache';
import NoCache from './cache/NoCache';

// Certain chains lack proper infrastructure, so we don't index events for them
// Note: these are prime candidates for delisting from the app if no long term solutions are found
const DO_NOT_INDEX = [ChainId.PulseChain, ChainId.BitTorrentChainMainnet];

class EventsDB {
  constructor(private cache: ICache<Events, [number, string]>) {}

  // Note: It is always assumed that this function is called to get logs for the entire chain (i.e. from block 0 to 'latest')
  // So we assume that the filter.fromBlock is always 0, and we only need to retrieve events between the last stored event and 'latest'
  // This means that we can't use this function to get logs for a specific block range
  async getLogs(logsProvider: LogsProvider, filter: Filter, chainId: number, nameTag?: string): Promise<Log[]> {
    await this.cache.initialize();

    const logs = await this.getLogsInternal(logsProvider, filter, chainId);

    if (nameTag) {
      const cacheType = this.cache.constructor.name;
      console.log(`${getChainName(chainId)}: ${nameTag} logs [${cacheType}]`, logs);
    }

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

      const cachedEvents = await this.cache.get([chainId, topicsKey]);

      // If we already have events stored, we only need to get events from the last stored event to the latest block
      const fromBlock = cachedEvents?.toBlock ? cachedEvents.toBlock + 1 : filter.fromBlock;

      // If the fromBlock is greater than the toBlock, it means that we already have all the events
      if (fromBlock > toBlock) {
        return cachedEvents!.logs.filter(
          (log) => log.blockNumber >= filter.fromBlock && log.blockNumber <= filter.toBlock,
        );
      }

      const newLogs = await logsProvider.getLogs({ ...filter, fromBlock, toBlock });
      const logs = [...(cachedEvents?.logs || []), ...newLogs];

      await this.cache.put([chainId, topicsKey], { chainId, address, topicsKey, topics, toBlock, logs });
      return logs;
    } catch (e) {
      console.error(e);
      if (e instanceof CacheError) return logsProvider.getLogs(filter);

      throw e;
    }
  }
}

const cache: ICache<Events, [number, string]> = isBrowser() ? new EventsDexieCache() : new NoCache();
const eventsDB = new EventsDB(cache);

export default eventsDB;
