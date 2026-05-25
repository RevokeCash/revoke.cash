import type { DocumentedChainId } from '@revoke.cash/core/chains';
import { getDb } from '@revoke.cash/core/db/client';
import {
  indexerAllowanceState,
  indexerEventsState,
  type indexerTokenMetadata,
} from '@revoke.cash/core/db/schema/indexer';
import { type Filter, isApprovalTokenEvent, type Log, parseLog, type TokenEvent } from '@revoke.cash/core/events';
import { buildTokenEventFilters } from '@revoke.cash/core/events/filters';
import { processErc721ApprovalEvents, removeLoneRevokeEvents } from '@revoke.cash/core/events/processing';
import { DatabaseLogsProvider } from '@revoke.cash/core/events/providers';
import { sortTokenEventsChronologically } from '@revoke.cash/core/events/utils';
import { deduplicateArray, isNullish } from '@revoke.cash/core/utils';
import { and, eq } from 'drizzle-orm';
import type { Address } from 'viem';
import { type CachedAllowanceRow, getCachedAllowances } from './allowances';
import {
  type CachedAddressDataDto,
  type CachedAllowanceDto,
  type CachedTokenEventDto,
  serializeAllowanceFromRow,
  serializeApprovalEvent,
} from './allowances-dto';
import { ChainUnresponsiveError } from './errors';
import { resolveAndPersistTimestampsForBlocks } from './timestamps';
import { getCachedTokenMetadata } from './token-metadata';

type TokenMetadataRow = typeof indexerTokenMetadata.$inferSelect;
type ScanState = Pick<typeof indexerEventsState.$inferSelect, 'consecutiveFailures' | 'lastError' | 'lastScanAt'>;
type FailureState = Pick<ScanState, 'consecutiveFailures' | 'lastError'> | null | undefined;
interface CachedAddressDataOptions {
  failFast?: boolean;
  resolveMissingTimestamps?: boolean;
}

// After this many recorded failures we surface the stored `last_error` to the dashboard instead
// of quietly returning stale cache data. Matches the threshold where the scheduler backs off to
// a 24-hour cadence.
const FAIL_FAST_FAILURE_THRESHOLD = 3;

const getScanState = async (address: Address, chainId: DocumentedChainId): Promise<ScanState | undefined> => {
  return getDb().query.indexerEventsState.findFirst({
    where: and(eq(indexerEventsState.address, address), eq(indexerEventsState.chainId, chainId)),
    columns: { consecutiveFailures: true, lastError: true, lastScanAt: true },
  });
};

const getAllowanceFailureState = async (address: Address, chainId: DocumentedChainId): Promise<FailureState> => {
  return getDb().query.indexerAllowanceState.findFirst({
    where: and(eq(indexerAllowanceState.address, address), eq(indexerAllowanceState.chainId, chainId)),
    columns: { consecutiveFailures: true, lastError: true },
  });
};

// Throws `ChainUnresponsiveError` (HTTP 503 with the stored `last_error` in the body) when
// the indexer has repeatedly failed for this (address, chain). This avoids returning stale or
// empty cache data with no indication that updates are broken.
const failFastIfIndexingIsFailing = (state: FailureState, chainId: DocumentedChainId): void => {
  if (state && state.consecutiveFailures >= FAIL_FAST_FAILURE_THRESHOLD && state.lastError) {
    throw new ChainUnresponsiveError(chainId, state.lastError);
  }
};

export const failFastIfAddressIndexingIsFailing = async (
  address: Address,
  chainId: DocumentedChainId,
): Promise<ScanState | undefined> => {
  const [scanState, allowanceState] = await Promise.all([
    getScanState(address, chainId),
    getAllowanceFailureState(address, chainId),
  ]);

  failFastIfIndexingIsFailing(scanState, chainId);
  failFastIfIndexingIsFailing(allowanceState, chainId);

  return scanState;
};

export const getCachedAddressData = async (
  address: Address,
  chainId: DocumentedChainId,
  options: CachedAddressDataOptions = {},
): Promise<CachedAddressDataDto> => {
  return readFromIndexedCache(address, chainId, options);
};

const readFromIndexedCache = async (
  address: Address,
  chainId: DocumentedChainId,
  { failFast = true, resolveMissingTimestamps = false }: CachedAddressDataOptions,
): Promise<CachedAddressDataDto> => {
  const scanState = failFast
    ? await failFastIfAddressIndexingIsFailing(address, chainId)
    : await getScanState(address, chainId);

  const { state, rows: allowanceRows } = await getCachedAllowances(address, chainId);

  const stateDto = {
    checkedAt: scanState?.lastScanAt?.toISOString() ?? null,
    computedToBlock: state?.computedToBlock ?? null,
  };

  const toBlock = state?.computedToBlock ?? 0;
  const rawEvents = await fetchEventsFromCache(address, chainId, toBlock, { resolveMissingTimestamps });

  const uniqueTokens = deduplicateArray(rawEvents.map((event) => event.token));
  const metadataByToken = await getCachedTokenMetadata(chainId, uniqueTokens);

  const allowances = serializeAllowances(allowanceRows, metadataByToken);
  const events = serializeHistoryRelevantEvents(rawEvents, metadataByToken);

  return { state: stateDto, allowances, events };
};

const isUsableMetadata = (metadata?: TokenMetadataRow): boolean => {
  if (metadata === undefined) return false;
  if (!isNullish(metadata.spamReason)) return false;
  if (!isNullish(metadata.enrichmentError)) return false;
  return true;
};

// Pull approval/transfer events for this user from the events cache up to `toBlock`. The cached
// GET path stays cache-only so an unresponsive chain cannot make the dashboard hang. The refresh
// POST path can opt into resolving missing timestamps before serialization, while the final filter
// still guarantees that every event returned to the client has a timestamp.
const fetchEventsFromCache = async (
  address: Address,
  chainId: DocumentedChainId,
  toBlock: number,
  { resolveMissingTimestamps = false }: Pick<CachedAddressDataOptions, 'resolveMissingTimestamps'> = {},
): Promise<TokenEvent[]> => {
  const logsProvider = new DatabaseLogsProvider(chainId);
  const filters: Filter[] = Object.values(buildTokenEventFilters(address, 0, toBlock));

  const logsByFilter = await Promise.all(filters.map((filter) => logsProvider.getLogs(filter)));
  const rawLogs = resolveMissingTimestamps
    ? await attachMissingTimestamps(chainId, logsByFilter.flat())
    : logsByFilter.flat();

  return rawLogs
    .map((log) => parseLog(log, chainId, address))
    .filter((event): event is TokenEvent => !isNullish(event))
    .filter((event) => event.time.timestamp !== undefined);
};

const attachMissingTimestamps = async (chainId: DocumentedChainId, logs: Log[]): Promise<Log[]> => {
  const missingTimestampBlocks = logs.filter((log) => isNullish(log.timestamp)).map((log) => log.blockNumber);
  if (missingTimestampBlocks.length === 0) return logs;

  const timestampsByBlock = await resolveAndPersistTimestampsForBlocks(chainId, missingTimestampBlocks);
  return logs.map((log) => {
    if (!isNullish(log.timestamp)) return log;
    return { ...log, timestamp: timestampsByBlock.get(log.blockNumber) };
  });
};

// Drop spurious ERC721 transfer-triggered "revokes", annotate genuine revokes with `oldSpender`,
// drop token/spender groups that are pure revokes (spam). Then narrow Transfers to the tokens
// that still have approval events after that cleanup.
const cleanAndNarrowEvents = (events: TokenEvent[]): TokenEvent[] => {
  const approvalEvents = events.filter(isApprovalTokenEvent);
  const cleanedApprovals = removeLoneRevokeEvents(processErc721ApprovalEvents(approvalEvents));
  const approvalTokens = new Set(cleanedApprovals.map((event) => event.token));
  const transferEvents = events.filter((event) => !isApprovalTokenEvent(event) && approvalTokens.has(event.token));
  return [...cleanedApprovals, ...transferEvents];
};

const serializeHistoryRelevantEvents = (
  events: TokenEvent[],
  metadataByToken: Map<Address, TokenMetadataRow>,
): CachedTokenEventDto[] => {
  const cleanedEvents = cleanAndNarrowEvents(events);
  const approvalOnly = cleanedEvents.filter(isApprovalTokenEvent);
  const eligibleEvents = approvalOnly.filter((event) => isUsableMetadata(metadataByToken.get(event.token)));
  const sorted = sortTokenEventsChronologically(eligibleEvents).reverse();
  return sorted.map((event) => serializeApprovalEvent(event, metadataByToken.get(event.token)!));
};

const serializeAllowances = (
  allowanceRows: CachedAllowanceRow[],
  metadataByToken: Map<Address, TokenMetadataRow>,
): CachedAllowanceDto[] => {
  return allowanceRows
    .filter((row) => isUsableMetadata(metadataByToken.get(row.tokenAddress)))
    .map((row) => serializeAllowanceFromRow(row, metadataByToken.get(row.tokenAddress)!));
};
