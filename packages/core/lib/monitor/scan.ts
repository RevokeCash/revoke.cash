import blocksCache from '@revoke.cash/core/cache/blocks';
import {
  createViemPublicClientForChain,
  type DocumentedChainId,
  getChainLogsRpcUrl,
  isBackendSupportedChain,
} from '@revoke.cash/core/chains';
import { hasChainActivity } from '@revoke.cash/core/chains/events';
import { type DatabaseTransaction, type DatabaseWriter, getDb, getTransactionalDb } from '@revoke.cash/core/db/client';
import { monitorEventsCache, monitorScanState } from '@revoke.cash/core/db/schema/monitor';
import type { Filter, Log } from '@revoke.cash/core/events';
import {
  DivideAndConquerLogsProvider,
  type LogsProvider,
  ScriptLogsProvider,
  ViemLogsProvider,
} from '@revoke.cash/core/events/providers';
import { addressToTopic } from '@revoke.cash/core/events/utils';
import { HOUR, MINUTE, SECOND } from '@revoke.cash/core/utils/time';
import { and, eq, gte, lte } from 'drizzle-orm';
import type { Address, Hex, PublicClient } from 'viem';
import { buildTokenEventFilters } from '../events/filters';
import { chunkArray, isNullish } from '../utils';
import { isLogRequestSizeError, isLogResponseSizeError, parseErrorMessage } from '../utils/errors';
import { mapAsync, mapAsyncSequential } from '../utils/promises';

// Most chains have RPC limits around 10k blocks, so this should be safe. Some chains might have a lower public RPC
// limit, which gets handled by the DivideAndConquerLogsProvider.
const NARROW_RANGE_THRESHOLD = 10_000;
const REORG_DEPTH = 12;
const ACTIVE_WINDOW_MS = 7 * 24 * HOUR;

const MIN_BLOCK_RANGE = 1_000;

// If a filter returns more than 50k logs, this is an indication that the scan size is too large,
// and if a filter returns less than 50 logs, this is an indication that the scan size can safely increase.
const MAX_LOGS_PER_FILTER = 50_000;
const MIN_LOGS_PER_FILTER = 50;

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
  rangeReductions: number;
  durationMs: number;
}

const buildScanResult = (overrides: Partial<ScanResult> = {}): ScanResult => ({
  fromBlock: 0,
  toBlock: 0,
  path: 'wide',
  logsFetched: 0,
  logsWritten: 0,
  nonceZeroSkipped: false,
  isCapped: false,
  rangeReductions: 0,
  durationMs: 0,
  ...overrides,
});

export const scanAddressChain = async (address: Address, chainId: DocumentedChainId): Promise<ScanResult> => {
  const start = Date.now();
  const db = getDb();
  const existingState = await db.query.monitorScanState.findFirst({
    where: and(eq(monitorScanState.address, address), eq(monitorScanState.chainId, chainId)),
  });

  const publicClient = createViemPublicClientForChain(chainId);

  if (!(await hasChainActivity(chainId, address, publicClient))) {
    return skipAndReschedule(db, address, chainId, existingState, {
      nonceZeroSkipped: true,
      durationMs: Date.now() - start,
    });
  }

  const initialMaxBlockRange = existingState?.maxBlockRange ?? Number.POSITIVE_INFINITY;
  const { fromBlock, toBlock, isCapped } = await computeScanRange(
    publicClient,
    existingState?.lastToBlock,
    initialMaxBlockRange,
  );

  // Chain head is behind our cursor (deep reorg, or briefly stale RPC response)
  if (toBlock < fromBlock) {
    return skipAndReschedule(db, address, chainId, existingState, {
      fromBlock,
      toBlock,
      durationMs: Date.now() - start,
    });
  }

  const addressTopic = addressToTopic(address);

  return runWithRangeReduction(fromBlock, toBlock, async (currentToBlock, rangeReductions) => {
    const isNarrow = currentToBlock - fromBlock <= NARROW_RANGE_THRESHOLD;
    const logsProvider = getScanLogsProvider(chainId, isNarrow);
    const filters = Object.values(buildTokenEventFilters(address, fromBlock, currentToBlock));

    const filterResults = await getTransactionalDb().transaction(async (trx) => {
      const results = await mapAsyncSequential(filters, (filter) =>
        scanFilter(trx, chainId, logsProvider, filter, addressTopic),
      );

      await commitScanState(trx, publicClient, address, chainId, existingState, {
        fromBlock,
        currentToBlock,
        isCapped,
        rangeReductions,
        filterResults: results,
      });
      return results;
    });

    return buildScanResult({
      fromBlock,
      toBlock: currentToBlock,
      path: isNarrow ? 'narrow' : 'wide',
      logsFetched: filterResults.reduce((acc, r) => acc + r.logsFetched, 0),
      logsWritten: filterResults.reduce((acc, r) => acc + r.logsWritten, 0),
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
  return isLogResponseSizeError(error) || isLogRequestSizeError(error);
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

const skipAndReschedule = async (
  writer: DatabaseWriter,
  address: Address,
  chainId: number,
  existingState: typeof monitorScanState.$inferSelect | undefined,
  resultOverrides: Partial<ScanResult>,
): Promise<ScanResult> => {
  await upsertScanState(writer, address, chainId, {
    nextRunAt: computeNextRunAt(existingState?.consecutiveFailures ?? 0, existingState?.lastEventAt),
  });
  return buildScanResult(resultOverrides);
};

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
  maxBlockRange: number,
): Promise<{ fromBlock: number; toBlock: number; isCapped: boolean }> => {
  const fromBlock = !isNullish(cursor) ? Math.max(0, cursor - REORG_DEPTH + 1) : 0;
  const head = Number(await publicClient.getBlockNumber());
  const cappedToBlock = fromBlock + maxBlockRange;
  const toBlock = Math.min(head, cappedToBlock);
  return { fromBlock, toBlock, isCapped: toBlock < head };
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
// catchup batch (more history pending) → next scheduler tick
// active (events in last 7d) → 5 min
// otherwise → 1h
export const computeNextRunAt = (
  failures: number,
  lastEventAt: Date | null | undefined,
  isCatchupBatch = false,
): Date => {
  const now = Date.now();
  if (failures >= 3) return new Date(now + 24 * HOUR);
  if (isCatchupBatch) return new Date(now);
  if (lastEventAt && lastEventAt.getTime() > now - ACTIVE_WINDOW_MS) return new Date(now + 5 * MINUTE);
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

// Reorg-safe wipe of the events this filter would re-insert in its block range.
const deleteFilterEventsInRange = async (
  trx: DatabaseTransaction,
  chainId: number,
  filter: Filter,
  addressTopic: Hex,
): Promise<void> => {
  const topic0 = filter.topics[0] as Hex;
  const addressColumn = filter.topics[1] === addressTopic ? monitorEventsCache.topic1 : monitorEventsCache.topic2;

  await trx
    .delete(monitorEventsCache)
    .where(
      and(
        eq(monitorEventsCache.chainId, chainId),
        gte(monitorEventsCache.blockNumber, filter.fromBlock),
        lte(monitorEventsCache.blockNumber, filter.toBlock),
        eq(monitorEventsCache.topic0, topic0),
        eq(addressColumn, addressTopic),
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

interface FilterScanResult {
  logsFetched: number;
  logsWritten: number;
  latestLog: Log | null;
}

const scanFilter = async (
  trx: DatabaseTransaction,
  chainId: number,
  logsProvider: LogsProvider,
  filter: Filter,
  addressTopic: Hex,
): Promise<FilterScanResult> => {
  await deleteFilterEventsInRange(trx, chainId, filter, addressTopic);

  const logs = await logsProvider.getLogs(filter);
  const rows = logs.map((log) => toEventsCacheRow(chainId, log));

  return {
    logsFetched: logs.length,
    logsWritten: await insertEventRowsChunked(trx, rows),
    latestLog: latestLogByBlock(logs),
  };
};

const latestLogByBlock = (logs: (Log | null | undefined)[]): Log | null => {
  return logs.reduce<Log | null>((latest, log) => {
    if (!log) return latest;
    if (!latest || log.blockNumber > latest.blockNumber) return log;
    return latest;
  }, null);
};

interface CommitScanStateParams {
  fromBlock: number;
  currentToBlock: number;
  isCapped: boolean;
  rangeReductions: number;
  filterResults: FilterScanResult[];
}

const commitScanState = async (
  trx: DatabaseTransaction,
  publicClient: PublicClient,
  address: Address,
  chainId: number,
  existingState: typeof monitorScanState.$inferSelect | undefined,
  params: CommitScanStateParams,
): Promise<void> => {
  const lastEventAt = await resolveLastEventAt(publicClient, existingState?.lastEventAt, params.filterResults);

  const effectiveIsCapped = params.isCapped || params.rangeReductions > 0;

  const newMaxBlockRange = computeNewMaxBlockRange(params, existingState?.maxBlockRange);

  await upsertScanState(trx, address, chainId, {
    lastScanAt: new Date(),
    lastToBlock: params.currentToBlock,
    maxBlockRange: newMaxBlockRange,
    lastEventAt,
    nextRunAt: computeNextRunAt(0, lastEventAt, effectiveIsCapped),
    consecutiveFailures: 0,
    lastError: null,
  });
};

const computeNewMaxBlockRange = (params: CommitScanStateParams, existing: number | null | undefined): number | null => {
  const range = params.currentToBlock - params.fromBlock;
  if (params.rangeReductions > 0) return range;

  const maxFilterLogs = Math.max(0, ...params.filterResults.map((r) => r.logsFetched));
  if (maxFilterLogs > MAX_LOGS_PER_FILTER) return Math.max(MIN_BLOCK_RANGE, Math.floor(range / 2));
  if (!isNullish(existing) && maxFilterLogs < MIN_LOGS_PER_FILTER) return existing * 2;

  return existing ?? null;
};

const resolveLastEventAt = async (
  publicClient: PublicClient,
  existing: Date | null | undefined,
  filterResults: FilterScanResult[],
): Promise<Date | null> => {
  const latestLog = latestLogByBlock(filterResults.map((r) => r.latestLog));
  if (!latestLog) return existing ?? null;

  const timestampSeconds = await blocksCache.getLogTimestamp(publicClient, latestLog);
  const candidate = new Date(timestampSeconds * SECOND);

  if (!existing) return candidate;
  return candidate.getTime() > existing.getTime() ? candidate : existing;
};
