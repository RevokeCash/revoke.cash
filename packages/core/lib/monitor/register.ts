import { ORDERED_CHAINS } from '@revoke.cash/core/chains';
import type { DatabaseTransaction } from '@revoke.cash/core/db/client';
import { monitorScanState } from '@revoke.cash/core/db/schema/monitor';
import type { Address } from 'viem';

export const registerAddressForMonitoring = async (trx: DatabaseTransaction, address: Address): Promise<void> => {
  const rows = ORDERED_CHAINS.map((chainId) => ({ address, chainId }));
  await trx.insert(monitorScanState).values(rows).onConflictDoNothing();
};
