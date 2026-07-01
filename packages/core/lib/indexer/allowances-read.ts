import { type AddressData, AllowanceType, type TokenAllowanceData } from '@revoke.cash/core/allowances';
import type { DocumentedChainId } from '@revoke.cash/core/chains';
import {
  type ApprovalTokenEvent,
  type EnrichedTokenEvent,
  type Filter,
  isApprovalTokenEvent,
  type Log,
  parseLog,
  type TokenEvent,
  TokenEventType,
} from '@revoke.cash/core/events';
import { buildTokenEventFilters } from '@revoke.cash/core/events/filters';
import { processErc721ApprovalEvents, removeLoneRevokeEvents } from '@revoke.cash/core/events/processing';
import { DatabaseLogsProvider } from '@revoke.cash/core/events/providers';
import { sortTokenEventsChronologically } from '@revoke.cash/core/events/utils';
import { deduplicateArray, isNullish } from '@revoke.cash/core/utils';
import { SECOND } from '@revoke.cash/core/utils/time';
import type { Address } from 'viem';
import { type CachedAllowanceRow, getCachedAllowances, serializeAllowanceFromRow } from './allowances';
import {
  failFastIfAllowanceStateIsBehind,
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

  failFastIfIndexingIsFailing(eventsState, chainId);
  failFastIfIndexingIsFailing(allowanceState, chainId);

  failFastIfEventsStateIsBehind(eventsState);
  failFastIfAllowanceStateIsBehind(eventsState, allowanceState);

  const state = {
    checkedAt: eventsState?.lastScanAt?.toISOString() ?? null,
    computedToBlock: allowanceState?.computedToBlock ?? null,
  };

  const allowances = await loadEnrichedAddressAllowances(address, chainId);
  const events = await loadEnrichedHistoryEvents(address, chainId, allowanceState?.computedToBlock ?? 0);

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

const loadEnrichedHistoryEvents = async (
  address: Address,
  chainId: DocumentedChainId,
  toBlock: number,
): Promise<EnrichedTokenEvent[]> => {
  const rawEvents = await fetchEventsFromCache(address, chainId, toBlock);
  const uniqueTokens = deduplicateArray(rawEvents.map((event) => event.token));
  const metadataByToken = await getCompleteTokenMetadata(chainId, uniqueTokens);
  const historyEvents = getHistoryRelevantEvents(rawEvents, metadataByToken);
  const spenderMetadataByAddress = await getCompleteSpenderMetadata(
    chainId,
    deduplicateArray(historyEvents.map(getApprovalEventSpenderAddress)),
  );
  return serializeHistoryRelevantEvents(historyEvents, metadataByToken, spenderMetadataByAddress);
};

// Pull approval events for this user from the events cache up to `toBlock`. Metadata enrichment
// uses all parsed event tokens, while history serialization still only returns timestamped events.
const fetchEventsFromCache = async (
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

const getHistoryRelevantEvents = (
  events: TokenEvent[],
  metadataByToken: Map<Address, TokenMetadataRow>,
): ApprovalTokenEvent[] => {
  const cleanedEvents = cleanAndNarrowEvents(events);
  const approvalOnly = cleanedEvents.filter(isApprovalTokenEvent);
  return approvalOnly.filter((event) => isUsableTokenMetadata(metadataByToken.get(event.token)));
};

const getApprovalEventSpenderAddress = (event: ApprovalTokenEvent): Address => {
  if (event.type === TokenEventType.APPROVAL_ERC721 && event.payload.oldSpender) return event.payload.oldSpender;
  return event.payload.spender;
};

const serializeHistoryRelevantEvents = (
  events: ApprovalTokenEvent[],
  metadataByToken: Map<Address, TokenMetadataRow>,
  spenderMetadataByAddress: SpenderMetadataByAddress,
): EnrichedTokenEvent[] => {
  const sorted = sortTokenEventsChronologically(events).reverse();
  return sorted.map((event) => {
    const tokenMetadata = metadataByToken.get(event.token)!;
    const spenderMetadata = spenderMetadataByAddress.get(getApprovalEventSpenderAddress(event));
    return serializeApprovalEvent(event, tokenMetadata, spenderMetadata);
  });
};

const serializeApprovalEvent = (
  event: ApprovalTokenEvent,
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
