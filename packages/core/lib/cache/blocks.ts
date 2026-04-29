import { getChainName } from '@revoke.cash/core/chains';
import type { Log, ResolvedTimeLog, TimeLog } from '@revoke.cash/core/events';
import { isBrowser } from '@revoke.cash/core/utils';
import type { PublicClient } from 'viem';
import type { Block } from './dexie/BlocksDexie';
import BlocksDexieCache from './dexie/BlocksDexieCache';
import { CacheError, type ICache } from './ICache';
import BlocksPostgresCache from './postgres/BlocksPostgresCache';

class BlocksCache {
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
      console.error(`[${getChainName(publicClient.chain!.id)}] ${e}`);
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

  async getTimeLog(publicClient: PublicClient, log: TimeLog): Promise<ResolvedTimeLog> {
    const timestamp = await this.getLogTimestamp(publicClient, log);
    return { ...log, timestamp };
  }
}

const cache: ICache<Block, [number, number]> = isBrowser() ? new BlocksDexieCache() : new BlocksPostgresCache();
const blocksCache = new BlocksCache(cache);

export default blocksCache;
