import { ORDERED_CHAINS } from '@revoke.cash/core/chains';
import type { DatabaseWriter } from '@revoke.cash/core/db/client';
import { monitorScanState } from '@revoke.cash/core/db/schema/monitor';
import type { Address } from 'viem';

export const registerAddressForMonitoring = async (writer: DatabaseWriter, address: Address): Promise<void> => {
  const rows = ORDERED_CHAINS.map((chainId) => ({ address, chainId }));
  await writer.insert(monitorScanState).values(rows).onConflictDoNothing();
};
