import { getDb } from '@revoke.cash/core/db/client';
import { indexerAllowanceState, indexerEventsState } from '@revoke.cash/core/db/schema/indexer';
import { isNullish } from '@revoke.cash/core/utils';
import { and, eq } from 'drizzle-orm';
import type { Address } from 'viem';
import { ChainUnresponsiveError, StillIndexingError } from './errors';
import { assertIndexerIsNotTooFarBehind } from './progress';

export type EventsState = Pick<
  typeof indexerEventsState.$inferSelect,
  | 'consecutiveFailures'
  | 'disabledAt'
  | 'lastError'
  | 'lastObservedHeadBlock'
  | 'lastScanAt'
  | 'lastToBlock'
  | 'maxBlockRange'
>;

export type AllowanceState = Pick<
  typeof indexerAllowanceState.$inferSelect,
  'computedToBlock' | 'consecutiveFailures' | 'lastError'
>;

type FailureState =
  | Pick<EventsState, 'consecutiveFailures' | 'lastError'>
  | Pick<AllowanceState, 'consecutiveFailures' | 'lastError'>
  | null
  | undefined;

export interface IndexerReadStates {
  eventsState: EventsState | undefined;
  allowanceState: AllowanceState | undefined;
}

// After this many recorded failures we surface the stored `last_error` to the dashboard instead
// of quietly returning stale cache data. Matches the threshold where the scheduler backs off to
// a 24-hour cadence.
const FAIL_FAST_FAILURE_THRESHOLD = 3;

export const getIndexerEventsState = async (address: Address, chainId: number): Promise<EventsState | undefined> => {
  return getDb().query.indexerEventsState.findFirst({
    where: and(eq(indexerEventsState.address, address), eq(indexerEventsState.chainId, chainId)),
    columns: {
      consecutiveFailures: true,
      disabledAt: true,
      lastError: true,
      lastObservedHeadBlock: true,
      lastScanAt: true,
      lastToBlock: true,
      maxBlockRange: true,
    },
  });
};

export const getIndexerAllowanceState = async (
  address: Address,
  chainId: number,
): Promise<AllowanceState | undefined> => {
  return getDb().query.indexerAllowanceState.findFirst({
    where: and(eq(indexerAllowanceState.address, address), eq(indexerAllowanceState.chainId, chainId)),
    columns: { computedToBlock: true, consecutiveFailures: true, lastError: true },
  });
};

export const getIndexerReadStates = async (address: Address, chainId: number): Promise<IndexerReadStates> => {
  const [eventsState, allowanceState] = await Promise.all([
    getIndexerEventsState(address, chainId),
    getIndexerAllowanceState(address, chainId),
  ]);
  return { eventsState, allowanceState };
};

// Throws `ChainUnresponsiveError` when the indexer has repeatedly failed for this
// (address, chain). This avoids returning stale or empty cache data with no indication that
// updates are broken.
export const failFastIfIndexingIsFailing = (state: FailureState, chainId: number): void => {
  if (state && state.consecutiveFailures >= FAIL_FAST_FAILURE_THRESHOLD && state.lastError) {
    throw new ChainUnresponsiveError(chainId, state.lastError);
  }
};

// This throws an error if the events have not even started to be indexed yet.
export const failFastIfEventsStateHasNoProgress = (state: EventsState | undefined): void => {
  if (isNullish(state?.lastToBlock) && isNullish(state?.lastObservedHeadBlock)) {
    throw new StillIndexingError(0, 0);
  }
};

export const failFastIfEventsStateIsBehind = (state: EventsState | undefined): void => {
  if (isNullish(state?.lastToBlock) || isNullish(state.lastObservedHeadBlock)) return;

  assertIndexerIsNotTooFarBehind({
    lastToBlock: state.lastToBlock,
    headBlock: state.lastObservedHeadBlock,
    maxBlockRange: state.maxBlockRange,
  });
};

export const failFastIfAllowanceStateIsBehind = (
  eventsState: EventsState | undefined,
  allowanceState: AllowanceState | undefined,
): void => {
  if (isNullish(eventsState?.lastToBlock)) return;

  const computedToBlock = allowanceState?.computedToBlock;
  if (isNullish(computedToBlock) || computedToBlock < eventsState.lastToBlock) {
    throw new StillIndexingError(computedToBlock ?? 0, eventsState.lastToBlock);
  }
};

export const isAllowanceCacheFresh = async (address: Address, chainId: number): Promise<boolean> => {
  const { eventsState, allowanceState } = await getIndexerReadStates(address, chainId);

  if (eventsState?.disabledAt) return false;
  if (isNullish(eventsState?.lastToBlock) || isNullish(eventsState?.lastObservedHeadBlock)) return false;
  if (isNullish(allowanceState?.computedToBlock)) return false;
  if (eventsState.lastToBlock < eventsState.lastObservedHeadBlock) return false; // Still indexing

  return allowanceState?.computedToBlock >= eventsState.lastToBlock;
};
