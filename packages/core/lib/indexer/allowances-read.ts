import { type AddressData, AllowanceType, type TokenAllowanceData } from '@revoke.cash/core/allowances';
import { getHistoryEventSpenderAddress } from '@revoke.cash/core/allowances/history';
import type { DocumentedChainId } from '@revoke.cash/core/chains';
import { getDb } from '@revoke.cash/core/db/client';
import { indexerEvents, indexerTransferDetails } from '@revoke.cash/core/db/schema/indexer';
import {
  type ApprovalTokenEvent,
  type EnrichedTokenEvent,
  ERC721_TRANSFER_TOPIC,
  type Filter,
  isApprovalTokenEvent,
  isTransferTokenEvent,
  type Log,
  parseLog,
  type TokenEvent,
  type TransferTokenEvent,
} from '@revoke.cash/core/events';
import { buildTokenEventFilters } from '@revoke.cash/core/events/filters';
import { processErc721ApprovalEvents, removeLoneRevokeEvents } from '@revoke.cash/core/events/processing';
import { DatabaseLogsProvider } from '@revoke.cash/core/events/providers';
import { formatDatabaseLog } from '@revoke.cash/core/events/providers/DatabaseLogsProvider';
import { addressToTopic, sortTokenEventsChronologically } from '@revoke.cash/core/events/utils';
import { isApprovedTransfersSupportedChain } from '@revoke.cash/core/transfers/config';
import { deduplicateArray, isNullish } from '@revoke.cash/core/utils';
import { SECOND } from '@revoke.cash/core/utils/time';
import { and, eq, isNull, sql } from 'drizzle-orm';
import type { Address } from 'viem';
import { type CachedAllowanceRow, getCachedAllowances, serializeAllowanceFromRow } from './allowances';
import {
  failFastIfAddressHasTooMuchActivity,
  failFastIfAddressIsTokenContract,
  failFastIfAllowanceStateIsBehind,
  failFastIfEventsStateHasNoProgress,
  failFastIfEventsStateIsBehind,
  failFastIfIndexingIsFailing,
  getIndexerReadStates,
} from './cache-state';
import {
  getCompleteSpenderMetadata,
  type SpenderMetadataByAddress,
  type SpenderMetadataRow,
  serializeSpenderMetadata,
} from './spender-metadata';
import { resolveAndPersistTimestampsForBlocks } from './timestamps';
import {
  getCompleteTokenMetadata,
  isUsableTokenMetadata,
  serializeTokenMetadata,
  type TokenMetadataRow,
} from './token-metadata';

export const getCachedAddressData = async (address: Address, chainId: DocumentedChainId): Promise<AddressData> => {
  const { eventsState, allowanceState } = await getIndexerReadStates(address, chainId);

  failFastIfAddressHasTooMuchActivity(eventsState, chainId);
  failFastIfAddressHasTooMuchActivity(allowanceState, chainId);
  failFastIfAddressIsTokenContract(eventsState, chainId);

  failFastIfIndexingIsFailing(eventsState, chainId);
  failFastIfIndexingIsFailing(allowanceState, chainId);

  failFastIfEventsStateHasNoProgress(eventsState);
  failFastIfEventsStateIsBehind(eventsState);
  failFastIfAllowanceStateIsBehind(eventsState, allowanceState);

  const allowances = await loadEnrichedAddressAllowances(address, chainId);
  const { events, pendingTransferClassifications } = await loadEnrichedHistoryEvents(
    address,
    chainId,
    allowanceState?.computedToBlock ?? 0,
  );

  const state = {
    checkedAt: eventsState?.lastScanAt?.toISOString() ?? null,
    computedToBlock: allowanceState?.computedToBlock ?? null,
    ...(isApprovedTransfersSupportedChain(chainId) ? { pendingTransferClassifications } : {}),
  };

  return { state, allowances, events };
};

export const loadEnrichedAddressAllowances = async (
  address: Address,
  chainId: DocumentedChainId,
): Promise<TokenAllowanceData[]> => {
  const { rows } = await getCachedAllowances(address, chainId);

  const [tokenMetadataByAddress, spenderMetadataByAddress] = await Promise.all([
    getCompleteTokenMetadata(chainId, deduplicateArray(rows.map((row) => row.tokenAddress))),
    getCompleteSpenderMetadata(chainId, deduplicateArray(rows.map((row) => row.spenderAddress))),
  ]);

  return serializeAllowances(rows, tokenMetadataByAddress, spenderMetadataByAddress);
};

const serializeAllowances = (
  rows: CachedAllowanceRow[],
  metadataByToken: Map<Address, TokenMetadataRow>,
  spenderMetadataByAddress: SpenderMetadataByAddress,
): TokenAllowanceData[] => {
  return rows
    .map((row) => {
      const tokenMetadata = metadataByToken.get(row.tokenAddress);
      if (!isCachedAllowanceActive(row) || !tokenMetadata || !isUsableTokenMetadata(tokenMetadata)) return null;
      return serializeAllowanceFromRow(row, tokenMetadata, spenderMetadataByAddress.get(row.spenderAddress));
    })
    .filter((allowance) => !isNullish(allowance));
};

interface HistoryEvents<T extends TokenEvent> {
  events: T[];
  pendingTransferClassifications: number;
}

const loadEnrichedHistoryEvents = async (
  address: Address,
  chainId: DocumentedChainId,
  toBlock: number,
): Promise<HistoryEvents<EnrichedTokenEvent>> => {
  const [approvals, approvedTransfers] = await Promise.all([
    fetchApprovalEventsFromCache(address, chainId, toBlock),
    fetchApprovedTransferEvents(address, chainId),
  ]);

  // Metadata enrichment covers all parsed tokens; display filtering below narrows to usable metadata.
  const parsedEvents = [...cleanApprovalEvents(approvals), ...approvedTransfers.events];
  const uniqueTokens = deduplicateArray(parsedEvents.map((event) => event.token));
  const metadataByToken = await getCompleteTokenMetadata(chainId, uniqueTokens);

  const usableEvents = parsedEvents.filter((event) => isUsableTokenMetadata(metadataByToken.get(event.token)));

  const spenderMetadataByAddress = await getCompleteSpenderMetadata(
    chainId,
    deduplicateArray(usableEvents.map(getHistoryEventSpenderAddress).filter((spender) => !isNullish(spender))),
  );

  const events = serializeHistoryRelevantEvents(usableEvents, metadataByToken, spenderMetadataByAddress);

  return {
    events,
    pendingTransferClassifications: approvedTransfers.pendingTransferClassifications,
  };
};

// Pull approval events for this user from the events cache up to `toBlock`. Timestamps are guaranteed
// attached afterwards: timestamp resolution either covers every requested block or fails the request.
const fetchApprovalEventsFromCache = async (
  address: Address,
  chainId: DocumentedChainId,
  toBlock: number,
): Promise<TokenEvent[]> => {
  const logsProvider = new DatabaseLogsProvider(chainId);
  const filters: Filter[] = Object.values(
    buildTokenEventFilters(address, 0, toBlock, { includeTransferFromEvents: false }),
  );

  const logsByFilter = await Promise.all(filters.map((filter) => logsProvider.getLogs(filter)));
  const rawLogs = await attachMissingTimestamps(chainId, logsByFilter.flat());

  return rawLogs.map((log) => parseLog(log, chainId, address)).filter((event) => !isNullish(event));
};

const fetchApprovedTransferEvents = async (
  address: Address,
  chainId: DocumentedChainId,
): Promise<HistoryEvents<TransferTokenEvent>> => {
  if (!isApprovedTransfersSupportedChain(chainId)) return { events: [], pendingTransferClassifications: 0 };

  const db = getDb();
  const ownerTopic = addressToTopic(address);
  const outboundTransferConditions = and(
    eq(indexerEvents.chainId, chainId),
    eq(indexerEvents.topic0, ERC721_TRANSFER_TOPIC),
    eq(indexerEvents.topic1, ownerTopic),
    eq(indexerEvents.reorged, false),
  );

  const [rows, pendingRows] = await Promise.all([
    db
      .select({ event: indexerEvents, details: indexerTransferDetails })
      .from(indexerEvents)
      .innerJoin(
        indexerTransferDetails,
        and(
          eq(indexerTransferDetails.chainId, indexerEvents.chainId),
          eq(indexerTransferDetails.transactionHash, indexerEvents.transactionHash),
          eq(indexerTransferDetails.logIndex, indexerEvents.logIndex),
        ),
      )
      .where(and(outboundTransferConditions, eq(indexerTransferDetails.classification, 'approved'))),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(indexerEvents)
      .where(and(outboundTransferConditions, isNull(indexerEvents.classifiedAt))),
  ]);

  const detailsByEventKey = new Map(
    rows.map(({ event, details }) => [`${event.transactionHash}-${event.logIndex}`, details]),
  );

  const rawLogs = rows.map(({ event }) => formatDatabaseLog(event));
  const logs = await attachMissingTimestamps(chainId, rawLogs);

  const events = logs
    .map((log) => {
      const event = parseLog(log, chainId, address);
      if (isNullish(event) || !isTransferTokenEvent(event)) return null;
      const details = detailsByEventKey.get(`${log.transactionHash}-${log.logIndex}`);
      event.payload.spender = details?.spenderAddress ?? undefined;
      event.payload.permit2Address = details?.permit2Address ?? undefined;
      return event;
    })
    .filter((event) => !isNullish(event));

  return { events, pendingTransferClassifications: pendingRows[0]?.count ?? 0 };
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
// drop token/spender groups that are pure revokes (spam).
const cleanApprovalEvents = (events: TokenEvent[]): ApprovalTokenEvent[] => {
  return removeLoneRevokeEvents(processErc721ApprovalEvents(events.filter(isApprovalTokenEvent)));
};

const serializeHistoryRelevantEvents = (
  events: TokenEvent[],
  metadataByToken: Map<Address, TokenMetadataRow>,
  spenderMetadataByAddress: SpenderMetadataByAddress,
): EnrichedTokenEvent[] => {
  const sorted = sortTokenEventsChronologically(events).reverse();
  return sorted.map((event) => {
    const tokenMetadata = metadataByToken.get(event.token)!;
    const spenderAddress = getHistoryEventSpenderAddress(event);
    const spenderMetadata = isNullish(spenderAddress) ? undefined : spenderMetadataByAddress.get(spenderAddress);
    return serializeHistoryEvent(event, tokenMetadata, spenderMetadata);
  });
};

const serializeHistoryEvent = (
  event: TokenEvent,
  metadata: TokenMetadataRow,
  spenderMetadata?: SpenderMetadataRow,
): EnrichedTokenEvent =>
  ({
    ...event,
    payload: { ...event.payload, spenderData: serializeSpenderMetadata(spenderMetadata) },
    time: { ...event.time, timestamp: event.time.timestamp! },
    metadata: serializeTokenMetadata(metadata),
  }) as EnrichedTokenEvent;

export const isCachedAllowanceActive = (
  row: Pick<CachedAllowanceRow, 'allowanceType' | 'expiration'>,
  referenceTimestamp = Date.now(),
): boolean => {
  if (row.allowanceType !== AllowanceType.PERMIT2) return true;
  if (isNullish(row.expiration)) return false;

  return row.expiration > Math.floor(referenceTimestamp / SECOND);
};
