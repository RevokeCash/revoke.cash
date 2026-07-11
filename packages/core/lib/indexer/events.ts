import blocksCache from '@revoke.cash/core/cache/blocks';
import {
  createViemPublicClientForChain,
  type DocumentedChainId,
  getChainLogsRpcUrl,
  isBackendSupportedChain,
} from '@revoke.cash/core/chains';
import { hasChainActivity } from '@revoke.cash/core/chains/events';
import { type DatabaseTransaction, type DatabaseWriter, getDb, getTransactionalDb } from '@revoke.cash/core/db/client';
import { indexerEvents, indexerEventsState } from '@revoke.cash/core/db/schema/indexer';
import { acquireAdvisoryLock } from '@revoke.cash/core/db/utils';
import { ERC721_TRANSFER_TOPIC, type Filter, type Log } from '@revoke.cash/core/events';
import {
  DivideAndConquerLogsProvider,
  type LogsProvider,
  ScriptLogsProvider,
  ViemLogsProvider,
} from '@revoke.cash/core/events/providers';
import { addressToTopic } from '@revoke.cash/core/events/utils';
import { HOUR, SECOND } from '@revoke.cash/core/utils/time';
import { and, eq, gte, lte, sql } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import type { Address, Hex, PublicClient } from 'viem';
import { buildTokenEventFilters } from '../events/filters';
import { chunkArray, deduplicateArray, isNullish } from '../utils';
import {
  isEventGetterTimeoutError,
  isLogRequestSizeError,
  isLogResponseSizeError,
  parseErrorMessage,
} from '../utils/errors';
import { mapAsync, mapAsyncSequential, withTimeout } from '../utils/promises';

// Most chains have RPC limits around 10k blocks, so this should be safe. Some chains might have a lower public RPC
// limit, which gets handled by the DivideAndConquerLogsProvider.
const NARROW_RANGE_THRESHOLD = 10_000;

// Block-rewind depth applied on every scheduled scan and mirrored on every allowance recompute
export const REORG_DEPTH = 12;

const MIN_BLOCK_RANGE = 1_000;
const MAX_BLOCK_RANGE = 1_000_000_000;
const FALLBACK_MAX_BLOCK_RANGE = 10_000_000;

// If a filter returns more than 50k logs, this is an indication that the scan size is too large,
// and if a filter returns less than 50 logs, this is an indication that the scan size can safely increase.
const MAX_LOGS_PER_FILTER = 50_000;
const MIN_LOGS_PER_FILTER = 50;

// Postgres caps a single statement at 65_535 bind parameters. indexerEvents rows have 11 columns,
// so a naive `INSERT … VALUES (…), (…), …` blows up around ~5_950 rows — easy to hit on initial
// genesis→head scans of busy wallets. 1_000 leaves comfortable headroom if a column is added later.
const INSERT_CHUNK_SIZE = 1_000;

export interface IndexEventsResult {
  fromBlock: number;
  toBlock: number;
  path: 'narrow' | 'wide';
  logsFetched: number;
  logsWritten: number;
  logsReorgedMarked: number;
  nonceZeroSkipped: boolean;
  isCapped: boolean;
  rangeReductions: number;
  durationMs: number;
}

const buildIndexEventsResult = (overrides: Partial<IndexEventsResult> = {}): IndexEventsResult => ({
  fromBlock: 0,
  toBlock: 0,
  path: 'wide',
  logsFetched: 0,
  logsWritten: 0,
  logsReorgedMarked: 0,
  nonceZeroSkipped: false,
  isCapped: false,
  rangeReductions: 0,
  durationMs: 0,
  ...overrides,
});

export const indexEvents = async (address: Address, chainId: DocumentedChainId): Promise<IndexEventsResult> => {
  const start = Date.now();
  const db = getDb();
  const existingState = await db.query.indexerEventsState.findFirst({
    where: and(eq(indexerEventsState.address, address), eq(indexerEventsState.chainId, chainId)),
  });

  const publicClient = createViemPublicClientForChain(chainId);

  const initialMaxBlockRange = existingState?.maxBlockRange ?? Number.POSITIVE_INFINITY;
  const { fromBlock, toBlock, headBlock, isCapped } = await computeScanRange(
    publicClient,
    existingState?.lastToBlock,
    initialMaxBlockRange,
  );

  if (isNullish(existingState?.lastToBlock) && !(await hasChainActivity(chainId, address, publicClient))) {
    await upsertEventsState(db, address, chainId, {
      nextRunAt: computeNextRunAt(0),
      consecutiveFailures: 0,
      lastError: null,
      lastObservedHeadBlock: headBlock,
    });
    return buildIndexEventsResult({ nonceZeroSkipped: true, durationMs: Date.now() - start });
  }

  const addressTopic = addressToTopic(address);

  return runWithRangeReduction(fromBlock, toBlock, async (currentToBlock, rangeReductions) => {
    const isNarrow = currentToBlock - fromBlock <= NARROW_RANGE_THRESHOLD;
    const logsProvider = getScanLogsProvider(chainId, isNarrow);
    const filters = Object.values(buildTokenEventFilters(address, fromBlock, currentToBlock));
    const fetchedFilterEvents = await fetchFilterEvents(chainId, logsProvider, filters, isNarrow);
    const latestEventAt = await resolveLatestEventAt(publicClient, fetchedFilterEvents);

    const committedFilterEvents = await getTransactionalDb().transaction(async (trx) => {
      await acquireEventsIndexingLock(trx, address, chainId);

      const currentState = await trx.query.indexerEventsState.findFirst({
        where: and(eq(indexerEventsState.address, address), eq(indexerEventsState.chainId, chainId)),
        columns: { lastEventAt: true, lastScanAt: true, lastToBlock: true, maxBlockRange: true },
      });

      if (eventScanWasSuperseded(start, currentState, currentToBlock)) {
        return null;
      }

      const results = await commitFetchedFilterEvents(trx, chainId, fetchedFilterEvents, addressTopic);

      await commitEventsState(trx, address, chainId, currentState, {
        fromBlock,
        currentToBlock,
        headBlock,
        isCapped,
        rangeReductions,
        committedFilterEvents: results,
        latestEventAt,
      });
      return results;
    });

    return buildIndexEventsResult({
      fromBlock,
      toBlock: currentToBlock,
      path: isNarrow ? 'narrow' : 'wide',
      logsFetched: fetchedFilterEvents.reduce((acc, r) => acc + r.logsFetched, 0),
      logsWritten: committedFilterEvents?.reduce((acc, r) => acc + r.logsWritten, 0) ?? 0,
      logsReorgedMarked: committedFilterEvents?.reduce((acc, r) => acc + r.logsReorgedMarked, 0) ?? 0,
      isCapped: isCapped || rangeReductions > 0,
      rangeReductions,
      durationMs: Date.now() - start,
    });
  });
};

const getScanLogsProvider = (chainId: number, isNarrow: boolean): LogsProvider => {
  const viemLogsProvider = new ViemLogsProvider(chainId, getChainLogsRpcUrl(chainId));

  if (!isNarrow) {
    if (isBackendSupportedChain(chainId)) return new ScriptLogsProvider(chainId);
    return viemLogsProvider;
  }

  return new DivideAndConquerLogsProvider(viemLogsProvider, { splitOnRequestSize: true });
};

const isSplittableScanError = (error: unknown): boolean => {
  return isLogResponseSizeError(error) || isLogRequestSizeError(error) || isEventGetterTimeoutError(error);
};

const runWithRangeReduction = async <T>(
  fromBlock: number,
  toBlock: number,
  attempt: (currentToBlock: number, rangeReductions: number) => Promise<T>,
  rangeReductions: number = 0,
): Promise<T> => {
  try {
    return await attempt(toBlock, rangeReductions);
  } catch (error) {
    if (!isSplittableScanError(error)) throw error;
    const range = toBlock - fromBlock;
    if (range <= MIN_BLOCK_RANGE) throw error; // pathological event density; let BullMQ handle it

    const halvedToBlock = fromBlock + Math.floor(range / 2);
    return runWithRangeReduction(fromBlock, halvedToBlock, attempt, rangeReductions + 1);
  }
};

export const recordEventsFailure = async (
  address: Address,
  chainId: DocumentedChainId,
  error: unknown,
): Promise<void> => {
  const db = getDb();
  const existingState = await db.query.indexerEventsState.findFirst({
    where: and(eq(indexerEventsState.address, address), eq(indexerEventsState.chainId, chainId)),
  });

  const failures = (existingState?.consecutiveFailures ?? 0) + 1;
  await upsertEventsState(db, address, chainId, {
    consecutiveFailures: failures,
    lastError: parseErrorMessage(error),
    nextRunAt: computeNextRunAt(failures),
  });
};

export const reduceEventsMaxBlockRangeAfterFailure = async (
  address: Address,
  chainId: DocumentedChainId,
): Promise<number> => {
  const db = getDb();
  const existingState = await db.query.indexerEventsState.findFirst({
    where: and(eq(indexerEventsState.address, address), eq(indexerEventsState.chainId, chainId)),
    columns: { maxBlockRange: true },
  });

  const currentMaxBlockRange = existingState?.maxBlockRange;
  const nextMaxBlockRange = isNullish(currentMaxBlockRange)
    ? FALLBACK_MAX_BLOCK_RANGE
    : Math.max(MIN_BLOCK_RANGE, Math.floor(currentMaxBlockRange / 2));

  await upsertEventsState(db, address, chainId, { maxBlockRange: nextMaxBlockRange });
  return nextMaxBlockRange;
};

const computeScanRange = async (
  publicClient: PublicClient,
  cursor: number | null | undefined,
  maxBlockRange: number,
): Promise<{ fromBlock: number; toBlock: number; headBlock: number; isCapped: boolean }> => {
  const fromBlock = !isNullish(cursor) ? Math.max(0, cursor - REORG_DEPTH + 1) : 0;
  const headBlock = await withTimeout(publicClient.getBlockNumber().then(Number), 10 * SECOND, 'RPC is unresponsive');
  const cappedToBlock = fromBlock + maxBlockRange;
  const toBlock = Math.min(headBlock, cappedToBlock);
  return { fromBlock, toBlock, headBlock, isCapped: toBlock < headBlock };
};

type EventsStateUpdate = Partial<typeof indexerEventsState.$inferInsert>;

const upsertEventsState = async (
  writer: DatabaseWriter,
  address: Address,
  chainId: number,
  update: EventsStateUpdate,
) => {
  await writer
    .insert(indexerEventsState)
    .values({ address, chainId, ...update })
    .onConflictDoUpdate({
      target: [indexerEventsState.address, indexerEventsState.chainId],
      set: update,
    });
};

const acquireEventsIndexingLock = async (
  writer: DatabaseWriter,
  address: Address,
  chainId: DocumentedChainId,
): Promise<void> => {
  await acquireAdvisoryLock(writer, `events:${chainId}:${address}`);
};

const eventScanWasSuperseded = (
  scanStartedAtMs: number,
  currentState: Pick<typeof indexerEventsState.$inferSelect, 'lastScanAt' | 'lastToBlock'> | undefined,
  currentToBlock: number,
): boolean => {
  if (isNullish(currentState?.lastToBlock)) return false;
  if (currentState.lastToBlock > currentToBlock) return true;
  return currentState.lastToBlock === currentToBlock && (currentState.lastScanAt?.getTime() ?? 0) > scanStartedAtMs;
};

// failures >= 3 → 24h recovery
// catchup batch (more history pending) → next scheduler tick
// otherwise → 1h
export const computeNextRunAt = (failures: number, isCatchupBatch = false): Date => {
  const now = Date.now();
  if (failures >= 3) return new Date(now + 24 * HOUR);
  if (isCatchupBatch) return new Date(now);
  return new Date(now + 1 * HOUR);
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

const excluded = <TColumn extends AnyPgColumn>(column: TColumn) =>
  sql<TColumn['_']['data']>`excluded.${sql.identifier(column.name)}`;

// Reorg-safe mark: flag every event in this filter's block range with `reorged = true`
// This flag will be set to `false` again if the event is re-added in the same scan
const markFilterEventsAsReorged = async (
  trx: DatabaseTransaction,
  chainId: number,
  filter: Filter,
  addressTopic: Hex,
): Promise<number> => {
  const topic0 = filter.topics[0] as Hex;
  const addressColumn = filter.topics[1] === addressTopic ? indexerEvents.topic1 : indexerEvents.topic2;

  const result = await trx
    .update(indexerEvents)
    .set({ reorged: true })
    .where(
      and(
        eq(indexerEvents.chainId, chainId),
        gte(indexerEvents.blockNumber, filter.fromBlock),
        lte(indexerEvents.blockNumber, filter.toBlock),
        eq(indexerEvents.topic0, topic0),
        eq(addressColumn, addressTopic),
      ),
    );

  return result.rowCount ?? 0;
};

// Chunked to stay under Postgres's 65_535-bind-parameter-per-statement limit. Atomicity is the
// caller's transaction's responsibility — every chunk runs inside the same transaction.
const insertEventRowsChunked = async (trx: DatabaseTransaction, rows: EventsCacheRow[]): Promise<number> => {
  if (rows.length === 0) return 0;

  const uniqueRows = deduplicateArray(rows, (row) => `${row.chainId}-${row.transactionHash}-${row.logIndex}`);
  const chunks = chunkArray(uniqueRows, INSERT_CHUNK_SIZE);
  const results = await mapAsync(chunks, (chunk) =>
    trx
      .insert(indexerEvents)
      .values(chunk)
      .onConflictDoUpdate({
        target: [indexerEvents.chainId, indexerEvents.transactionHash, indexerEvents.logIndex],
        set: {
          address: excluded(indexerEvents.address),
          transactionIndex: excluded(indexerEvents.transactionIndex),
          blockNumber: excluded(indexerEvents.blockNumber),
          topic0: excluded(indexerEvents.topic0),
          topic1: excluded(indexerEvents.topic1),
          topic2: excluded(indexerEvents.topic2),
          topic3: excluded(indexerEvents.topic3),
          data: excluded(indexerEvents.data),
          timestamp: excluded(indexerEvents.timestamp),
          reorged: false,
        },
      }),
  );

  return results.reduce((acc, result) => acc + (result.rowCount ?? 0), 0);
};

interface CommittedFilterEvents {
  logsFetched: number;
  logsWritten: number;
  logsReorgedMarked: number;
  latestLog: Log | null;
}

interface FetchedFilterEvents {
  filter: Filter;
  logsFetched: number;
  latestLog: Log | null;
  rows: EventsCacheRow[];
}

const fetchFilterEvents = async (
  chainId: number,
  logsProvider: LogsProvider,
  filters: readonly Filter[],
  parallelFetch: boolean,
): Promise<FetchedFilterEvents[]> => {
  const logsByFilter = parallelFetch
    ? await Promise.all(filters.map((filter) => logsProvider.getLogs(filter)))
    : await mapAsyncSequential(filters, (filter) => logsProvider.getLogs(filter));

  const filterWithLogs = filters.map((filter, i) => ({ filter, logs: logsByFilter[i] }));
  return filterWithLogs.map(({ filter, logs }) => buildFetchedFilterEvents(chainId, filter, logs));
};

const buildFetchedFilterEvents = (chainId: number, filter: Filter, fetchedLogs: Log[]): FetchedFilterEvents => {
  // For Transfer filters, drop zero-value ERC20 Transfers, since this is spam and carries no information.
  const meaningfulLogs = filter.topics[0] === ERC721_TRANSFER_TOPIC ? fetchedLogs.filter(isMeaningfulLog) : fetchedLogs;
  const rows = meaningfulLogs.map((log) => toEventsCacheRow(chainId, log));

  return {
    filter,
    logsFetched: fetchedLogs.length,
    latestLog: latestLogByBlock(meaningfulLogs),
    rows,
  };
};

const commitFetchedFilterEvents = async (
  trx: DatabaseTransaction,
  chainId: number,
  fetchedFilterEvents: FetchedFilterEvents[],
  addressTopic: Hex,
): Promise<CommittedFilterEvents[]> =>
  mapAsyncSequential(fetchedFilterEvents, async (result) => {
    const logsReorgedMarked = await markFilterEventsAsReorged(trx, chainId, result.filter, addressTopic);
    const logsWritten = await insertEventRowsChunked(trx, result.rows);

    return {
      logsFetched: result.logsFetched,
      logsWritten,
      logsReorgedMarked,
      latestLog: result.latestLog,
    };
  });

const isMeaningfulLog = (log: Log): boolean => {
  // ERC721 Transfer has 4 topics (signature + from + to + tokenId) and empty `data`. Always keep.
  if (log.topics.length !== 3) return true;
  // ERC20 Transfer has 3 topics; data is the value. Drop pure-zero-value spam.
  const ZERO_VALUE_TRANSFER_DATA = `0x${'0'.repeat(64)}`;
  return log.data !== ZERO_VALUE_TRANSFER_DATA;
};

const latestLogByBlock = (logs: (Log | null | undefined)[]): Log | null => {
  return logs.reduce<Log | null>((latest, log) => {
    if (!log) return latest;
    if (!latest || log.blockNumber > latest.blockNumber) return log;
    return latest;
  }, null);
};

interface CommitEventsStateParams {
  fromBlock: number;
  currentToBlock: number;
  headBlock: number;
  isCapped: boolean;
  rangeReductions: number;
  committedFilterEvents: CommittedFilterEvents[];
  latestEventAt: Date | null;
}

const commitEventsState = async (
  trx: DatabaseTransaction,
  address: Address,
  chainId: number,
  existingState: Pick<typeof indexerEventsState.$inferSelect, 'lastEventAt' | 'maxBlockRange'> | undefined,
  params: CommitEventsStateParams,
): Promise<void> => {
  const lastEventAt = latestDate(existingState?.lastEventAt, params.latestEventAt);
  const effectiveIsCapped = params.isCapped || params.rangeReductions > 0;

  const newMaxBlockRange = computeNewMaxBlockRange(params, existingState?.maxBlockRange);

  await upsertEventsState(trx, address, chainId, {
    lastScanAt: new Date(),
    lastToBlock: params.currentToBlock,
    lastObservedHeadBlock: params.headBlock,
    maxBlockRange: newMaxBlockRange,
    lastEventAt,
    nextRunAt: computeNextRunAt(0, effectiveIsCapped),
    consecutiveFailures: 0,
    lastError: null,
  });
};

const computeNewMaxBlockRange = (
  params: CommitEventsStateParams,
  existing: number | null | undefined,
): number | null => {
  const range = params.currentToBlock - params.fromBlock;
  if (params.rangeReductions > 0) return range;

  const maxFilterLogs = Math.max(0, ...params.committedFilterEvents.map((r) => r.logsFetched));
  if (maxFilterLogs > MAX_LOGS_PER_FILTER) return Math.max(MIN_BLOCK_RANGE, Math.floor(range / 2));
  if (!isNullish(existing) && maxFilterLogs < MIN_LOGS_PER_FILTER) {
    const next = existing * 2;
    return next > MAX_BLOCK_RANGE ? null : next;
  }

  return existing ?? null;
};

const resolveLatestEventAt = async (
  publicClient: PublicClient,
  fetchedFilterEvents: FetchedFilterEvents[],
): Promise<Date | null> => {
  const latestLog = latestLogByBlock(fetchedFilterEvents.map((r) => r.latestLog));
  if (!latestLog) return null;

  const timestampSeconds = await blocksCache.getLogTimestamp(publicClient, latestLog);
  return new Date(timestampSeconds * SECOND);
};

const latestDate = (a: Date | null | undefined, b: Date | null | undefined): Date | null => {
  if (!a) return b ?? null;
  if (!b) return a;
  return a.getTime() > b.getTime() ? a : b;
};
