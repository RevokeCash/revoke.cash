// The impact count that the labels CLI prints before a spender or token change.
import { getDb } from '@revoke.cash/core/db/client';
import { indexerAllowances } from '@revoke.cash/core/db/schema/indexer';
import { lowercaseAddressArray } from '@revoke.cash/core/db/types/lowercase-address';
import { ALL_CHAINS_CHAIN_ID } from '@revoke.cash/core/labels/merge';
import { activeSubscriptionsQuery } from '@revoke.cash/core/premium/subscriptions';
import { and, eq, exists, sql } from 'drizzle-orm';
import type { Address } from 'viem';

interface AffectedWalletsQuery {
  // ALL_CHAINS_CHAIN_ID counts every chain
  chainId: number;
  addresses: Address[];
  column: 'spender' | 'token';
}

export const countAffectedWallets = async (
  params: AffectedWalletsQuery,
): Promise<{ wallets: number; ultimateWallets: number }> => {
  const { chainId, addresses, column } = params;
  const db = getDb();

  const addressColumn = column === 'spender' ? indexerAllowances.spenderAddress : indexerAllowances.tokenAddress;
  const isUltimateWallet = exists(activeSubscriptionsQuery(db, indexerAllowances.address, 'ultimate'));

  const [result] = await db
    .select({
      wallets: sql<number>`count(DISTINCT ${indexerAllowances.address})::int`,
      ultimateWallets: sql<number>`count(DISTINCT ${indexerAllowances.address}) FILTER (WHERE ${isUltimateWallet})::int`,
    })
    .from(indexerAllowances)
    .where(
      and(
        sql`${addressColumn} = any(${sql.param(addresses, lowercaseAddressArray)}::text[])`,
        chainId === ALL_CHAINS_CHAIN_ID ? undefined : eq(indexerAllowances.chainId, chainId),
      ),
    );

  return result;
};
