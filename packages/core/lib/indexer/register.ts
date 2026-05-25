import { ORDERED_CHAINS } from '@revoke.cash/core/chains';
import type { DatabaseWriter } from '@revoke.cash/core/db/client';
import { indexerEventsState } from '@revoke.cash/core/db/schema/indexer';
import type { Address } from 'viem';

export const registerAddressForIndexing = async (writer: DatabaseWriter, address: Address): Promise<void> => {
  const rows = ORDERED_CHAINS.map((chainId) => ({ address, chainId }));
  await writer.insert(indexerEventsState).values(rows).onConflictDoNothing();
};
