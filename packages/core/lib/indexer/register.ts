import { ORDERED_CHAINS } from '@revoke.cash/core/chains';
import type { DatabaseWriter } from '@revoke.cash/core/db/client';
import { indexerEventsState } from '@revoke.cash/core/db/schema/indexer';
import { and, inArray, isNull, notInArray } from 'drizzle-orm';
import type { Address } from 'viem';

export const registerAddressForIndexing = async (writer: DatabaseWriter, address: Address): Promise<void> => {
  const rows = ORDERED_CHAINS.map((chainId) => ({ address, chainId }));
  await writer.insert(indexerEventsState).values(rows).onConflictDoNothing();
};

export const scheduleEventsReindex = async (
  writer: DatabaseWriter,
  addresses: Address[],
  chainIds: number[],
  runAt: Date = new Date(),
): Promise<void> => {
  if (addresses.length === 0 || chainIds.length === 0) return;

  await writer
    .update(indexerEventsState)
    .set({ nextRunAt: runAt })
    .where(and(inArray(indexerEventsState.address, addresses), inArray(indexerEventsState.chainId, chainIds)));
};

export const disableIndexingForRemovedChains = async (writer: DatabaseWriter): Promise<number> => {
  const result = await writer
    .update(indexerEventsState)
    .set({ disabledAt: new Date(), lastError: 'Chain has been removed from the chain config' })
    .where(and(isNull(indexerEventsState.disabledAt), notInArray(indexerEventsState.chainId, [...ORDERED_CHAINS])));

  return result.rowCount ?? 0;
};
