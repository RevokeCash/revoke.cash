import blocksCache from '@revoke.cash/core/cache/blocks';
import { createViemPublicClientForChain, type DocumentedChainId } from '@revoke.cash/core/chains';
import { getDb } from '@revoke.cash/core/db/client';
import { monitorEventsCache } from '@revoke.cash/core/db/schema/monitor';
import { mapAsyncBounded } from '@revoke.cash/core/utils/promises';
import { and, eq, isNull } from 'drizzle-orm';

const BATCH_SIZE = 500;
const CONCURRENCY = 100;

export interface ResolveTimestampsResult {
  chainId: number;
  blocksProcessed: number;
  rowsUpdated: number;
  durationMs: number;
  saturated: boolean;
}

export const resolveTimestamps = async (chainId: DocumentedChainId): Promise<ResolveTimestampsResult> => {
  const start = Date.now();
  const db = getDb();

  const pending = await db
    .selectDistinct({ blockNumber: monitorEventsCache.blockNumber })
    .from(monitorEventsCache)
    .where(and(eq(monitorEventsCache.chainId, chainId), isNull(monitorEventsCache.timestamp)))
    .limit(BATCH_SIZE);

  if (pending.length === 0) {
    return { chainId, blocksProcessed: 0, rowsUpdated: 0, durationMs: Date.now() - start, saturated: false };
  }

  // Single client → viem batches concurrent getBlock calls into JSON-RPC batches.
  const publicClient = createViemPublicClientForChain(chainId);

  const updateCounts = await mapAsyncBounded(pending, CONCURRENCY, async ({ blockNumber }) => {
    const timestamp = await blocksCache.getBlockTimestamp(publicClient, blockNumber);

    const result = await db
      .update(monitorEventsCache)
      .set({ timestamp })
      .where(
        and(
          eq(monitorEventsCache.chainId, chainId),
          eq(monitorEventsCache.blockNumber, blockNumber),
          isNull(monitorEventsCache.timestamp),
        ),
      );

    return result.rowCount ?? 0;
  });

  return {
    chainId,
    blocksProcessed: pending.length,
    rowsUpdated: updateCounts.reduce((sum, count) => sum + count, 0),
    durationMs: Date.now() - start,
    saturated: pending.length === BATCH_SIZE,
  };
};
