import type { DocumentedChainId } from '@revoke.cash/core/chains';
import { getDb } from '@revoke.cash/core/db/client';
import { monitorScanState } from '@revoke.cash/core/db/schema/monitor';
import type { Filter, Log } from '@revoke.cash/core/events';
import {
  DatabaseLogsProvider,
  getRpcLogsProvider,
  getScriptLogsProvider,
  type LogsProvider,
} from '@revoke.cash/core/events/providers';
import { topicToAddress } from '@revoke.cash/core/events/utils';
import { hasActivePremiumEntitlement } from '@revoke.cash/core/premium/entitlements';
import { and, eq } from 'drizzle-orm';
import type { Address } from 'viem';
import { MINUTE } from '../utils/time';
import { StillIndexingError } from './errors';

const WARM_THRESHOLD = 100_000;
const RPC_THRESHOLD = 10_000;
const INDEXER_STALLED_THRESHOLD = 90 * MINUTE;

export const getEventsForFilter = async (chainId: DocumentedChainId, filter: Filter): Promise<Log[]> => {
  const scriptLogsProvider = getScriptLogsProvider(chainId);
  const rpcLogsProvider = getRpcLogsProvider(chainId, { splitOnRequestSize: true });
  const databaseLogsProvider = new DatabaseLogsProvider(chainId);

  const userAddress = extractUserAddressFromFilter(filter);
  if (!userAddress) return scriptLogsProvider.getLogs(filter);

  const state = await getDb().query.monitorScanState.findFirst({
    where: and(eq(monitorScanState.address, userAddress), eq(monitorScanState.chainId, chainId)),
  });

  // If we've never scanned this wallet on this chain, fall back to the on-the-fly getter.
  if (!state || !state.lastScanAt || state.lastToBlock === null) {
    return scriptLogsProvider.getLogs(filter);
  }

  // If the wallet does not have an active premium subscription, fall back to the on-the-fly getter.
  if (!(await hasActivePremiumEntitlement(userAddress))) {
    return scriptLogsProvider.getLogs(filter);
  }

  // If the block range is greater than the warm threshold, we need to check if the indexer has stalled.
  // If the indexer has stalled, we fall back to on-the-fly getter.
  // If the indexer has not stalled, we throw an error to surface the indexing progress to the user.
  const blockRange = filter.toBlock - state.lastToBlock;
  if (blockRange > WARM_THRESHOLD) {
    if (indexerHasStalled(state.lastScanAt)) {
      return scriptLogsProvider.getLogs(filter);
    }

    throw new StillIndexingError(state.lastToBlock, filter.toBlock);
  }

  const freshLogsProvider = blockRange > RPC_THRESHOLD ? scriptLogsProvider : rpcLogsProvider;

  // If we're (mostly) caught up, fetch the cached events and the fresh events in parallel.
  const cacheCutoff = state.lastToBlock;
  const [cached, fresh] = await Promise.all([
    fetchCached(databaseLogsProvider, filter, cacheCutoff),
    fetchFresh(freshLogsProvider, filter, cacheCutoff),
  ]);
  return [...cached, ...fresh];
};

const fetchCached = (logsProvider: LogsProvider, filter: Filter, cacheCutoff: number): Promise<Log[]> => {
  if (filter.fromBlock > cacheCutoff) return Promise.resolve([]);
  return logsProvider.getLogs({
    ...filter,
    toBlock: Math.min(filter.toBlock, cacheCutoff),
  });
};

const fetchFresh = (logsProvider: LogsProvider, filter: Filter, cacheCutoff: number): Promise<Log[]> => {
  const fromBlock = Math.max(filter.fromBlock, cacheCutoff + 1);
  if (fromBlock > filter.toBlock) return Promise.resolve([]);
  return logsProvider.getLogs({ ...filter, fromBlock });
};

// The user's address sits in topic1 (Approvals, Transfers-from, Permit2 owner) or topic2 (Transfers-to)
const extractUserAddressFromFilter = (filter: Filter): Address | null => {
  const addressTopic = filter.topics[1] ?? filter.topics[2];
  if (!addressTopic) return null;
  return topicToAddress(addressTopic);
};

const indexerHasStalled = (lastScanAt: Date): boolean => {
  return lastScanAt.getTime() < Date.now() - INDEXER_STALLED_THRESHOLD;
};
