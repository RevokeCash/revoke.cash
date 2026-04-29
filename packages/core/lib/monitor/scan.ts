import blocksCache from '@revoke.cash/core/cache/blocks';
import { createViemPublicClientForChain, type DocumentedChainId, getChainLogsRpcUrl } from '@revoke.cash/core/chains';
import { type DatabaseTransaction, type DatabaseWriter, getDb, getTransactionalDb } from '@revoke.cash/core/db/client';
import { monitorEventsCache, monitorScanState } from '@revoke.cash/core/db/schema/monitor';
import type { Log } from '@revoke.cash/core/events';
import {
  DivideAndConquerLogsProvider,
  getScriptLogsProvider,
  type LogsProvider,
  ViemLogsProvider,
} from '@revoke.cash/core/events/providers';
import { addressToTopic } from '@revoke.cash/core/events/utils';
import { HOUR, MINUTE, SECOND } from '@revoke.cash/core/utils/time';
import { and, eq, gte, lte, or } from 'drizzle-orm';
import type { Address, Hex, PublicClient } from 'viem';
import { buildTokenEventFilters } from '../events/filters';
import { chunkArray, isNullish } from '../utils';
import { parseErrorMessage } from '../utils/errors';
import { mapAsync, mapAsyncBounded, mapAsyncSequential } from '../utils/promises';

// Most chains have RPC limits around 10k blocks, so this should be safe. Some chains might have a lower public RPC
// limit, which gets handled by the DivideAndConquerLogsProvider.
const NARROW_RANGE_THRESHOLD = 10_000;
const REORG_DEPTH = 12;
const ACTIVE_WINDOW_MS = 7 * 24 * HOUR;

const MAX_BLOCK_RANGE = 1_000_000;
const CATCHUP_INTERVAL_MS = 10 * SECOND;

// Postgres caps a single statement at 65_535 bind parameters. monitorEventsCache rows have 11 columns,
// so a naive `INSERT … VALUES (…), (…), …` blows up around ~5_950 rows — easy to hit on initial
// genesis→head scans of busy wallets. 1_000 leaves comfortable headroom if a column is added later.
const INSERT_CHUNK_SIZE = 1_000;

export interface ScanResult {
  fromBlock: number;
  toBlock: number;
  path: 'narrow' | 'wide';
  logsFetched: number;
  logsWritten: number;
  nonceZeroSkipped: boolean;
  isCapped: boolean;
}

const buildScanResult = (overrides: Partial<ScanResult> = {}): ScanResult => ({
  fromBlock: 0,
  toBlock: 0,
  path: 'wide',
  logsFetched: 0,
  logsWritten: 0,
  nonceZeroSkipped: false,
  isCapped: false,
  ...overrides,
});

export const scanAddressChain = async (address: Address, chainId: DocumentedChainId): Promise<ScanResult> => {
  const db = getDb();

  const existingState = await db.query.monitorScanState.findFirst({
    where: and(eq(monitorScanState.address, address), eq(monitorScanState.chainId, chainId)),
  });

  const publicClient = createViemPublicClientForChain(chainId);

  // Nonce-0 gate: if the wallet has never transacted on a chain, skip fetching entirely
  const nonce = await publicClient.getTransactionCount({ address });
  if (nonce === 0) {
    await upsertScanState(db, address, chainId, {
      nextRunAt: computeNextRunAt(existingState?.consecutiveFailures ?? 0, existingState?.lastEventAt),
    });

    return buildScanResult({ nonceZeroSkipped: true });
  }

  const { fromBlock, toBlock, isCapped } = await computeScanRange(publicClient, existingState?.lastToBlock);

  // Chain head is behind our cursor (deep reorg, or briefly stale RPC response)
  if (toBlock < fromBlock) {
    await upsertScanState(db, address, chainId, {
      nextRunAt: computeNextRunAt(existingState?.consecutiveFailures ?? 0, existingState?.lastEventAt),
    });

    return buildScanResult({ fromBlock, toBlock });
  }

  // Range-based fetch strategy: narrow → direct viem RPC, wide → event-getter chain.
  const isNarrow = toBlock - fromBlock <= NARROW_RANGE_THRESHOLD;
  const logsProvider = getScanLogsProvider(chainId, isNarrow);
  const filters = Object.values(buildTokenEventFilters(address, fromBlock, toBlock));
  const addressTopic = addressToTopic(address);

  // Note that we run these getLogs calls + db writes sequentially inside a single transaction,
  // rather than in parallel, to avoid holding all 7 filters' logs in memory after the loop completes.
  const results = await getTransactionalDb().transaction(async (trx) => {
    await deleteAddressEventsInRange(trx, chainId, addressTopic, fromBlock, toBlock);

    const results = await mapAsyncSequential(filters, async (filter) => {
      const logs = await logsProvider.getLogs(filter);

      const logsWithTimestamps = await attachTimestamps(publicClient, logs);
      const rows = logsWithTimestamps.map((log) => toEventsCacheRow(chainId, log));

      return {
        logsFetched: logs.length,
        logsWritten: await insertEventRowsChunked(trx, rows),
        maxTimestamp: getMaxTimestamp(logsWithTimestamps.map((log) => (log.timestamp ? log.timestamp * SECOND : null))),
      };
    });

    const maxTimestamp = getMaxTimestamp([
      existingState?.lastEventAt?.getTime(),
      ...results.map((r) => r.maxTimestamp),
    ]);
    const lastEventAt = maxTimestamp ? new Date(maxTimestamp) : null;

    const hasEventsInBatch = results.some((r) => r.logsFetched > 0);
    await upsertScanState(trx, address, chainId, {
      lastScanAt: new Date(),
      lastToBlock: toBlock,
      lastEventAt,
      nextRunAt: computeNextRunAt(0, lastEventAt, isCapped, hasEventsInBatch),
      consecutiveFailures: 0,
      lastError: null,
    });

    return results;
  });

  return buildScanResult({
    fromBlock,
    toBlock,
    path: isNarrow ? 'narrow' : 'wide',
    logsFetched: results.reduce((acc, r) => acc + r.logsFetched, 0),
    logsWritten: results.reduce((acc, r) => acc + r.logsWritten, 0),
    isCapped,
  });
};

const getScanLogsProvider = (chainId: number, isNarrow: boolean): LogsProvider => {
  if (!isNarrow) return getScriptLogsProvider(chainId);

  const viemLogsProvider = new ViemLogsProvider(chainId, getChainLogsRpcUrl(chainId));
  return new DivideAndConquerLogsProvider(viemLogsProvider, {
    splitOnRequestSize: true,
  });
};

/**
 * Records a definitive scan failure to `monitor.scan_state`. Should only be called by the
 * worker layer **after BullMQ has exhausted all in-process retry attempts** — not on every
 * thrown error from `scanAddressChain`. Otherwise a single transient outage would walk
 * `consecutive_failures` up by N (one per attempt) inside a single retry cycle.
 */
export const recordScanFailure = async (
  address: Address,
  chainId: DocumentedChainId,
  error: unknown,
): Promise<void> => {
  const db = getDb();
  const existingState = await db.query.monitorScanState.findFirst({
    where: and(eq(monitorScanState.address, address), eq(monitorScanState.chainId, chainId)),
  });

  const failures = (existingState?.consecutiveFailures ?? 0) + 1;
  await upsertScanState(db, address, chainId, {
    consecutiveFailures: failures,
    lastError: parseErrorMessage(error),
    nextRunAt: computeNextRunAt(failures, existingState?.lastEventAt),
  });
};

const computeScanRange = async (
  publicClient: PublicClient,
  cursor: number | null | undefined,
): Promise<{ fromBlock: number; toBlock: number; isCapped: boolean }> => {
  const fromBlock = !isNullish(cursor) ? Math.max(0, cursor - REORG_DEPTH + 1) : 0;
  const head = Number(await publicClient.getBlockNumber());
  const cappedToBlock = fromBlock + MAX_BLOCK_RANGE;
  const toBlock = Math.min(head, cappedToBlock);
  return { fromBlock, toBlock, isCapped: toBlock < head };
};

const getMaxTimestamp = (timestamps: (number | undefined | null)[]): number | null => {
  const freshestMs = timestamps.reduce<number>((max, timestamp) => {
    if (!timestamp) return max;
    return Math.max(max, timestamp);
  }, 0);

  return freshestMs > 0 ? freshestMs : null;
};

type ScanStateUpdate = Partial<typeof monitorScanState.$inferInsert>;

const upsertScanState = async (writer: DatabaseWriter, address: Address, chainId: number, update: ScanStateUpdate) => {
  await writer
    .insert(monitorScanState)
    .values({ address, chainId, ...update })
    .onConflictDoUpdate({
      target: [monitorScanState.address, monitorScanState.chainId],
      set: update,
    });
};

// failures >= 3 → 24h recovery
// catchup batch with events → 10s (give the system breathing room between busy chunks)
// catchup batch with no events → now (skip empty stretches of history fast)
// active (events in last 7d) → 5 min
// otherwise → 1h
export const computeNextRunAt = (
  failures: number,
  lastEventAt: Date | null | undefined,
  isCatchupBatch = false,
  hasEventsInBatch = true,
): Date => {
  const now = Date.now();
  if (failures >= 3) return new Date(now + 24 * HOUR);
  if (isCatchupBatch) return new Date(now + (hasEventsInBatch ? CATCHUP_INTERVAL_MS : 0));
  if (lastEventAt && lastEventAt.getTime() > now - ACTIVE_WINDOW_MS) return new Date(now + 5 * MINUTE);
  return new Date(now + 1 * HOUR);
};

const attachTimestamps = async (publicClient: PublicClient, logs: Log[]): Promise<Log[]> => {
  if (logs.length === 0) return logs;

  const uniqueBlockNumbers = [...new Set(logs.map((log) => log.blockNumber))];
  const blockTimestamps = new Map<number, number>();

  await mapAsyncBounded(uniqueBlockNumbers, 100, async (blockNumber) => {
    const timestamp = await blocksCache.getBlockTimestamp(publicClient, blockNumber);
    blockTimestamps.set(blockNumber, timestamp);
  });

  return logs.map((log) => ({ ...log, timestamp: log.timestamp ?? blockTimestamps.get(log.blockNumber) }));
};

const toEventsCacheRow = (chainId: number, log: Log) => ({
  chainId,
  address: log.address,
  transactionHash: log.transactionHash,
  transactionIndex: log.transactionIndex,
  logIndex: log.logIndex,
  blockNumber: log.blockNumber,
  topic0: log.topics[0],
  topic1: log.topics[1] ?? null,
  topic2: log.topics[2] ?? null,
  topic3: log.topics[3] ?? null,
  data: log.data,
  timestamp: log.timestamp ?? null,
});

type EventsCacheRow = ReturnType<typeof toEventsCacheRow>;

// Reorg-safe wipe of this address's slice of the cache for the scan range. The OR predicate
// matches both `to`-direction logs (address in topic2) and `from`-direction logs (address in
// topic1). Anything missing from the next inserts simply vanishes — that's how reorgs prune.
const deleteAddressEventsInRange = async (
  trx: DatabaseTransaction,
  chainId: number,
  addressTopic: Hex,
  fromBlock: number,
  toBlock: number,
): Promise<void> => {
  await trx
    .delete(monitorEventsCache)
    .where(
      and(
        eq(monitorEventsCache.chainId, chainId),
        gte(monitorEventsCache.blockNumber, fromBlock),
        lte(monitorEventsCache.blockNumber, toBlock),
        or(eq(monitorEventsCache.topic1, addressTopic), eq(monitorEventsCache.topic2, addressTopic)),
      ),
    );
};

// Chunked to stay under Postgres's 65_535-bind-parameter-per-statement limit. Atomicity is the
// caller's transaction's responsibility — every chunk runs inside the same transaction.
const insertEventRowsChunked = async (trx: DatabaseTransaction, rows: EventsCacheRow[]): Promise<number> => {
  if (rows.length === 0) return 0;

  const chunks = chunkArray(rows, INSERT_CHUNK_SIZE);
  const results = await mapAsync(chunks, (chunk) => trx.insert(monitorEventsCache).values(chunk).onConflictDoNothing());

  return results.reduce((acc, result) => acc + (result.rowCount ?? 0), 0);
};
