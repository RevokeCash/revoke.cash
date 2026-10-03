import { getChainConfig } from '@revoke.cash/core/chains';
import { getDb, getTransactionalDb } from '@revoke.cash/core/db/client';
import {
  indexerEvents,
  indexerEventsState,
  indexerTokenMetadata,
  indexerTransferDetails,
} from '@revoke.cash/core/db/schema/indexer';
import { ERC721_APPROVAL_FOR_ALL_TOPIC, ERC721_APPROVAL_TOPIC, ERC721_TRANSFER_TOPIC } from '@revoke.cash/core/events';
import { formatDatabaseLog } from '@revoke.cash/core/events/providers/DatabaseLogsProvider';
import { addressToTopic } from '@revoke.cash/core/events/utils';
import { TRACE_SUPPORTED_FROM_BLOCK, traceProviderKey } from '@revoke.cash/core/transfers/config';
import {
  extractTransferDetails,
  TransferClassification,
  type TransferDetailsResult,
} from '@revoke.cash/core/transfers/trace-classifier';
import { createTraceClient, type TraceCallFrame } from '@revoke.cash/core/transfers/trace-client';
import { isNullish } from '@revoke.cash/core/utils';
import { DAY, HOUR } from '@revoke.cash/core/utils/time';
import { and, eq, exists, gt, inArray, isNotNull, isNull, like, lt, or, sql } from 'drizzle-orm';
import type { Address, Hash } from 'viem';

export interface ClassifyTransactionResult {
  chainId: number;
  transactionHash: Hash;
  rowsClassified: number;
  rowsSkipped: number;
  durationMs: number;
}

type EventRow = typeof indexerEvents.$inferSelect;

type TraceLimiter = <T>(work: () => Promise<T>) => Promise<T>;

export const classifyTransaction = async (
  chainId: number,
  transactionHash: Hash,
  withTraceLimit: TraceLimiter = (work) => work(),
): Promise<ClassifyTransactionResult> => {
  const start = Date.now();
  const transferRows = await findUnclassifiedTransactionTransfers(chainId, transactionHash);
  if (transferRows.length === 0) {
    return { chainId, transactionHash, rowsClassified: 0, rowsSkipped: 0, durationMs: Date.now() - start };
  }

  const spamTokens = await findSpamTokens(chainId, transferRows);
  const approvedPairs = await findOwnerTokenPairsWithApprovalEvents(chainId, transferRows);

  const skipReason = (row: EventRow): string | undefined => {
    if (row.blockNumber < TRACE_SUPPORTED_FROM_BLOCK[chainId]) return 'skipped: transaction predates tracing support';
    if (spamTokens.includes(row.address)) return 'skipped: token flagged as spam';
    if (!approvedPairs.includes(ownerTokenPairKey(row))) return 'skipped: no approval events for owner and token';
    return undefined;
  };

  const skippedRows = transferRows.filter((row) => !isNullish(skipReason(row)));
  const tracedRows = transferRows.filter((row) => isNullish(skipReason(row)));

  if (skippedRows.length > 0) {
    const skippedResults = skippedRows.map((row) => ({
      classification: TransferClassification.UNKNOWN,
      error: skipReason(row),
    }));
    await persistTransactionResults(chainId, transactionHash, skippedRows, skippedResults);
  }

  if (tracedRows.length === 0) {
    return {
      chainId,
      transactionHash,
      rowsClassified: 0,
      rowsSkipped: skippedRows.length,
      durationMs: Date.now() - start,
    };
  }

  // Only the trace RPC call is rate-limited, so skip-only transactions never consume a trace slot
  const trace = await withTraceLimit(() => createTraceClient(chainId).traceTransaction(transactionHash));
  if (isNullish(trace)) throw new Error('trace not found for transaction');

  // The receipt has Transfer logs, so a trace without any frame logs means a degraded backend
  if (!traceContainsFrameLogs(trace)) throw new Error('trace has no frame logs');

  const results = extractTransferDetails(trace, tracedRows.map(formatDatabaseLog));
  await persistTransactionResults(chainId, transactionHash, tracedRows, results);
  return {
    chainId,
    transactionHash,
    rowsClassified: tracedRows.length,
    rowsSkipped: skippedRows.length,
    durationMs: Date.now() - start,
  };
};

const TRACE_FAILED_ERROR_PREFIX = 'trace failed: ';
export const recordExhaustedTransaction = async (
  chainId: number,
  transactionHash: Hash,
  error: string,
): Promise<void> => {
  const rows = await findUnclassifiedTransactionTransfers(chainId, transactionHash);
  if (rows.length === 0) return;

  const unknownResults = rows.map(() => ({
    classification: TransferClassification.UNKNOWN,
    error: `${TRACE_FAILED_ERROR_PREFIX}${error}`,
  }));
  await persistTransactionResults(chainId, transactionHash, rows, unknownResults);
};

// Terminal 'unknown' rows caused by trace failures are reset to unclassified after 24 hours so the regular
// scheduler can re-sweep them. Rows that keep failing for 30 days are permanently failing.
export const resweepFailedTraces = async (chainId: number): Promise<number> => {
  const resweepMinAgeCutoff = new Date(Date.now() - 24 * HOUR);
  const resweepMaxAgeCutoff = new Date(Date.now() - 30 * DAY);
  const transactionalDb = getTransactionalDb();

  return transactionalDb.transaction(async (trx) => {
    const resweptRows = await trx
      .update(indexerTransferDetails)
      .set({ classification: null })
      .where(
        and(
          eq(indexerTransferDetails.chainId, chainId),
          eq(indexerTransferDetails.classification, TransferClassification.UNKNOWN),
          like(indexerTransferDetails.error, `${TRACE_FAILED_ERROR_PREFIX}%`),
          lt(indexerTransferDetails.updatedAt, resweepMinAgeCutoff),
          gt(indexerTransferDetails.createdAt, resweepMaxAgeCutoff),
        ),
      )
      .returning({
        transactionHash: indexerTransferDetails.transactionHash,
        logIndex: indexerTransferDetails.logIndex,
      });

    for (const row of resweptRows) {
      await trx
        .update(indexerEvents)
        .set({ classifiedAt: null })
        .where(
          and(
            eq(indexerEvents.chainId, chainId),
            eq(indexerEvents.transactionHash, row.transactionHash),
            eq(indexerEvents.logIndex, row.logIndex),
          ),
        );
    }

    return resweptRows.length;
  });
};

const traceContainsFrameLogs = (frame: TraceCallFrame): boolean => {
  if ((frame.logs ?? []).length > 0) return true;
  return (frame.calls ?? []).some(traceContainsFrameLogs);
};

const findUnclassifiedTransactionTransfers = async (chainId: number, transactionHash: Hash): Promise<EventRow[]> => {
  const db = getDb();
  return db
    .select()
    .from(indexerEvents)
    .where(
      and(
        eq(indexerEvents.chainId, chainId),
        eq(indexerEvents.transactionHash, transactionHash),
        eq(indexerEvents.topic0, ERC721_TRANSFER_TOPIC),
        eq(indexerEvents.reorged, false),
        isNull(indexerEvents.classifiedAt),
      ),
    );
};

const findSpamTokens = async (chainId: number, rows: EventRow[]): Promise<Address[]> => {
  const db = getDb();
  const spamTokenRows = await db
    .select({ tokenAddress: indexerTokenMetadata.tokenAddress })
    .from(indexerTokenMetadata)
    .where(
      and(
        eq(indexerTokenMetadata.chainId, chainId),
        inArray(
          indexerTokenMetadata.tokenAddress,
          rows.map((row) => row.address),
        ),
        isNotNull(indexerTokenMetadata.spamReason),
      ),
    );

  return spamTokenRows.map((row) => row.tokenAddress);
};

const ownerTokenPairKey = (row: EventRow): string => `${row.address}|${row.topic1}`;

const findOwnerTokenPairsWithApprovalEvents = async (chainId: number, rows: EventRow[]): Promise<string[]> => {
  const db = getDb();
  const pairConditions = rows
    .filter((row) => !isNullish(row.topic1))
    .map((row) => and(eq(indexerEvents.address, row.address), eq(indexerEvents.topic1, row.topic1!)));
  if (pairConditions.length === 0) return [];

  const approvalRows = await db
    .selectDistinct({ address: indexerEvents.address, topic1: indexerEvents.topic1 })
    .from(indexerEvents)
    .where(
      and(
        eq(indexerEvents.chainId, chainId),
        inArray(indexerEvents.topic0, [ERC721_APPROVAL_TOPIC, ERC721_APPROVAL_FOR_ALL_TOPIC]),
        eq(indexerEvents.reorged, false),
        or(...pairConditions),
      ),
    );

  return approvalRows.map((row) => `${row.address}|${row.topic1}`);
};

const persistTransactionResults = async (
  chainId: number,
  transactionHash: Hash,
  rows: EventRow[],
  results: TransferDetailsResult[],
): Promise<void> => {
  // Postgres caps bind parameters at 65,535 per statement; chunk like the events insert does.
  const INSERT_CHUNK_SIZE = 1000;

  await getTransactionalDb().transaction(async (trx) => {
    for (let offset = 0; offset < rows.length; offset += INSERT_CHUNK_SIZE) {
      await trx
        .insert(indexerTransferDetails)
        .values(
          rows.slice(offset, offset + INSERT_CHUNK_SIZE).map((row, index) => ({
            chainId,
            transactionHash,
            logIndex: row.logIndex,
            spenderAddress: results[offset + index].spenderAddress ?? null,
            permit2Address: results[offset + index].permit2Address ?? null,
            selector: results[offset + index].selector ?? null,
            classification: results[offset + index].classification,
            error: results[offset + index].error ?? null,
          })),
        )
        .onConflictDoUpdate({
          target: [
            indexerTransferDetails.chainId,
            indexerTransferDetails.transactionHash,
            indexerTransferDetails.logIndex,
          ],
          set: {
            spenderAddress: sql`excluded.spender_address`,
            permit2Address: sql`excluded.permit2_address`,
            selector: sql`excluded.selector`,
            classification: sql`excluded.classification`,
            error: sql`excluded.error`,
            updatedAt: new Date(),
          },
        });
    }

    await trx
      .update(indexerEvents)
      .set({ classifiedAt: new Date() })
      .where(
        and(
          eq(indexerEvents.chainId, chainId),
          eq(indexerEvents.transactionHash, transactionHash),
          inArray(
            indexerEvents.logIndex,
            rows.map((row) => row.logIndex),
          ),
        ),
      );
  });
};

export const findUnclassifiedTransferTransactions = async (
  chainId: number,
  options: { ownerAddress?: Address; limit: number },
): Promise<Hash[]> => {
  const db = getDb();
  const ownerCondition = options.ownerAddress
    ? eq(indexerEvents.topic1, addressToTopic(options.ownerAddress))
    : exists(
        db
          .select({ address: indexerEventsState.address })
          .from(indexerEventsState)
          .where(
            and(
              eq(indexerEventsState.chainId, indexerEvents.chainId),
              sql`${indexerEventsState.address} = '0x' || substring(${indexerEvents.topic1} from 27)`,
              // A manually paused address must not keep its transfers being traced
              isNull(indexerEventsState.disabledAt),
            ),
          ),
      );

  const rows = await db
    .selectDistinct({ transactionHash: indexerEvents.transactionHash, blockNumber: indexerEvents.blockNumber })
    .from(indexerEvents)
    .where(
      and(
        eq(indexerEvents.chainId, chainId),
        eq(indexerEvents.topic0, ERC721_TRANSFER_TOPIC),
        eq(indexerEvents.reorged, false),
        isNull(indexerEvents.classifiedAt),
        ownerCondition,
      ),
    )
    .orderBy(sql`${indexerEvents.blockNumber} DESC`)
    .limit(options.limit);

  return rows.map((row) => row.transactionHash);
};

// The trace rate budget is keyed per provider; resolve the group key for a chain's configured trace RPC.
export const traceLimiterKeyForChain = (chainId: number): string => {
  return traceProviderKey(getChainConfig(chainId).getTracesRpcUrl(), chainId);
};
