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

    const chainId = publicClient.chain!.id;

    const storedBlock = await this.getStoredBlock(chainId, blockNumber);
    if (storedBlock) return storedBlock.timestamp;

    const block = await publicClient.getBlock({ blockNumber: BigInt(blockNumber) });
    const timestamp = Number(block?.timestamp);

    await this.storeBlock({ chainId, blockNumber, timestamp });

    return timestamp;
  }

  // Cache failures should never break timestamp resolution, so we fall back to fetching the block directly
  private async getStoredBlock(chainId: number, blockNumber: number): Promise<Block | undefined> {
    try {
      return await this.cache.get([chainId, blockNumber]);
    } catch (e) {
      console.error(`[${getChainName(chainId)}] ${e}`);
      if (e instanceof CacheError) return undefined;
      throw e;
    }
  }

  // Storing is best-effort: if the cache write fails, we still return the already-fetched timestamp
  private async storeBlock(block: Block): Promise<void> {
    try {
      await this.cache.put([block.chainId, block.blockNumber], block);
    } catch (e) {
      console.error(`[${getChainName(block.chainId)}] ${e}`);
      if (!(e instanceof CacheError)) throw e;
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
