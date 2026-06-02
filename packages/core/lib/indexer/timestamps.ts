import blocksCache from '@revoke.cash/core/cache/blocks';
import { createViemPublicClientForChain, type DocumentedChainId } from '@revoke.cash/core/chains';
import { getDb } from '@revoke.cash/core/db/client';
import { indexerEvents } from '@revoke.cash/core/db/schema/indexer';
import { mapAsyncBounded } from '@revoke.cash/core/utils/promises';
import { and, eq, isNull, sql } from 'drizzle-orm';
import type { PublicClient } from 'viem';

const BATCH_SIZE = 1000;
const CONCURRENCY = 100;

export interface ResolveTimestampsResult {
  chainId: number;
  blocksProcessed: number;
  rowsUpdated: number;
  durationMs: number;
  saturated: boolean;
}

export const resolveAndPersistTimestamps = async (chainId: DocumentedChainId): Promise<ResolveTimestampsResult> => {
  const start = Date.now();
  const db = getDb();

  const pending = await db
    .selectDistinct({ blockNumber: indexerEvents.blockNumber })
    .from(indexerEvents)
    .where(and(eq(indexerEvents.chainId, chainId), isNull(indexerEvents.timestamp)))
    .limit(BATCH_SIZE);

  if (pending.length === 0) {
    return { chainId, blocksProcessed: 0, rowsUpdated: 0, durationMs: Date.now() - start, saturated: false };
  }

  // Single client → viem batches concurrent getBlock calls into JSON-RPC batches.
  const publicClient = createViemPublicClientForChain(chainId);

  const timestampsByBlock = await resolveBlockTimestamps(
    publicClient,
    pending.map((row) => row.blockNumber),
  );
  const rowsUpdated = await persistResolvedTimestamps(chainId, timestampsByBlock);

  return {
    chainId,
    blocksProcessed: pending.length,
    rowsUpdated,
    durationMs: Date.now() - start,
    saturated: pending.length === BATCH_SIZE,
  };
};

export const resolveAndPersistTimestampsForBlocks = async (
  chainId: DocumentedChainId,
  blockNumbers: number[],
): Promise<Map<number, number>> => {
  if (blockNumbers.length === 0) return new Map();

  const publicClient = createViemPublicClientForChain(chainId);
  const timestampsByBlock = await resolveBlockTimestamps(publicClient, blockNumbers);
  await persistResolvedTimestamps(chainId, timestampsByBlock);
  return timestampsByBlock;
};

const resolveBlockTimestamps = async (
  publicClient: PublicClient,
  blockNumbers: number[],
): Promise<Map<number, number>> => {
  const uniqueBlocks = [...new Set(blockNumbers)];
  const timestampsByBlock = new Map<number, number>();

  await mapAsyncBounded(uniqueBlocks, CONCURRENCY, async (blockNumber) => {
    const timestamp = await blocksCache.getBlockTimestamp(publicClient, blockNumber);
    timestampsByBlock.set(blockNumber, timestamp);
  });

  return timestampsByBlock;
};

const persistResolvedTimestamps = async (
  chainId: DocumentedChainId,
  timestampsByBlock: Map<number, number>,
): Promise<number> => {
  if (timestampsByBlock.size === 0) return 0;

  const resolvedTimestampValues = sql.join(
    [...timestampsByBlock.entries()].map(
      ([blockNumber, timestamp]) => sql`(${blockNumber}::bigint, ${timestamp}::bigint)`,
    ),
    sql`, `,
  );

  const result = await getDb()
    .update(indexerEvents)
    .set({ timestamp: sql`resolved_timestamps.block_timestamp` })
    .from(sql`(VALUES ${resolvedTimestampValues}) AS resolved_timestamps(block_number, block_timestamp)`)
    .where(
      and(
        eq(indexerEvents.chainId, chainId),
        eq(indexerEvents.blockNumber, sql`resolved_timestamps.block_number`),
        isNull(indexerEvents.timestamp),
      ),
    );

  return result.rowCount ?? 0;
};
