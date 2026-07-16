import { getDb } from '@revoke.cash/core/db/client';
import { indexerBlockTimestamps } from '@revoke.cash/core/db/schema/indexer';
import { and, eq } from 'drizzle-orm';
import type { Block } from '../dexie/BlocksDexie';
import { CacheError, type ICache } from '../ICache';

export default class BlocksPostgresCache implements ICache<Block, [number, number]> {
  isInitialized(): boolean {
    return true;
  }

  async initialize(): Promise<void> {
    // No-op — the connection pool is created lazily on first query via `getDb()`.
  }

  async get([chainId, blockNumber]: [number, number]): Promise<Block | undefined> {
    try {
      const row = await getDb().query.indexerBlockTimestamps.findFirst({
        where: and(eq(indexerBlockTimestamps.chainId, chainId), eq(indexerBlockTimestamps.blockNumber, blockNumber)),
      });
      return row ?? undefined;
    } catch {
      throw new CacheError('Could not get data from cache');
    }
  }

  async put(_key: [number, number], data: Block): Promise<void> {
    try {
      await getDb()
        .insert(indexerBlockTimestamps)
        .values({ chainId: data.chainId, blockNumber: data.blockNumber, timestamp: data.timestamp })
        .onConflictDoNothing();
    } catch {
      throw new CacheError('Could not put data into cache');
    }
  }
}
