import { isBrowser } from 'lib/utils';
import type { Log, TimeLog } from 'lib/utils/events';
import type { PublicClient } from 'viem';
import type { Block } from './cache/BlocksDexie';
import BlocksDexieCache from './cache/BlocksDexieCache';
import { CacheError, type ICache } from './cache/ICache';
import NoCache from './cache/NoCache';

class BlocksDB {
  constructor(private cache: ICache<Block, [number, number]>) {}

  async getBlockTimestamp(publicClient: PublicClient, blockNumber: number): Promise<number> {
    await this.cache.initialize();

    try {
      const chainId = publicClient.chain!.id;
      const storedBlock = await this.cache.get([chainId, blockNumber]);
      if (storedBlock) return storedBlock.timestamp;

      const block = await publicClient.getBlock({ blockNumber: BigInt(blockNumber) });
      const timestamp = Number(block?.timestamp);

      await this.cache.put([chainId, blockNumber], { chainId, blockNumber, timestamp });
      return timestamp;
    } catch (e) {
      console.error(e);
      if (e instanceof CacheError) {
        const block = await publicClient.getBlock({ blockNumber: BigInt(blockNumber) });
        return Number(block?.timestamp);
      }

      throw e;
    }
  }

  async getLogTimestamp(publicClient: PublicClient, log: Pick<Log, 'timestamp' | 'blockNumber'>): Promise<number> {
    return log.timestamp ?? this.getBlockTimestamp(publicClient, log.blockNumber);
  }

  async getTimeLog(publicClient: PublicClient, log: TimeLog): Promise<TimeLog & { timestamp: number }> {
    const timestamp = await this.getLogTimestamp(publicClient, log);
    return { ...log, timestamp };
  }
}

const cache: ICache<Block, [number, number]> = isBrowser() ? new BlocksDexieCache() : new NoCache();
const blocksDB = new BlocksDB(cache);

export default blocksDB;
