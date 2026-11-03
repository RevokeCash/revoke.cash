// Server-only: reads labels.tokens and writes the token-list importer rows.
import { type DatabaseTransaction, getDb } from '@revoke.cash/core/db/client';
import { labelsTokens } from '@revoke.cash/core/db/schema/labels';
import { excluded } from '@revoke.cash/core/db/utils';
import type { TokenLabel } from '@revoke.cash/core/labels/merge';
import { chunkArray } from '@revoke.cash/core/utils';
import { mapAsyncSequential } from '@revoke.cash/core/utils/promises';
import { and, eq, sql } from 'drizzle-orm';
import type { Address } from 'viem';

export const getTokenLabel = async (chainId: number, address: Address): Promise<TokenLabel | undefined> => {
  const [label] = await getDb()
    .select()
    .from(labelsTokens)
    .where(and(eq(labelsTokens.chainId, chainId), eq(labelsTokens.address, address)));
  return label;
};

// One entry of the token-list importer: the columns that it owns
export interface TokenListEntry {
  chainId: number;
  address: Address;
  symbol: string;
  // NULL for OpenSea collections, which have no decimals
  decimals: number | null;
  logoUrl: string;
}

// The token-list importer writes only rows with edited_at NULL, only symbol, decimals, logo_url and imported_at, and never
// deletes. Postgres checks the WHERE against the latest committed row, so a CLI edit that commits first wins. now() is
// the transaction's start time, so all rows of one run share one imported_at. Returns the inserted and changed rows.
export const importTokenLabels = async (
  transaction: DatabaseTransaction,
  entries: TokenListEntry[],
): Promise<number> => {
  const changedRowCounts = await mapAsyncSequential(chunkArray(entries, 1_000), async (chunk) => {
    const changedRows = await transaction
      .insert(labelsTokens)
      .values(
        chunk.map(({ chainId, address, symbol, decimals, logoUrl }) => {
          return { chainId, address, symbol, decimals, logoUrl, importedAt: sql`now()` };
        }),
      )
      .onConflictDoUpdate({
        target: [labelsTokens.chainId, labelsTokens.address],
        set: {
          symbol: excluded(labelsTokens.symbol),
          decimals: excluded(labelsTokens.decimals),
          logoUrl: excluded(labelsTokens.logoUrl),
          importedAt: excluded(labelsTokens.importedAt),
        },
        // Row-wise IS DISTINCT FROM is null-safe per column, so NULL decimals against NULL is no change
        setWhere: sql`${labelsTokens.editedAt} IS NULL AND (${labelsTokens.symbol}, ${labelsTokens.decimals}, ${labelsTokens.logoUrl}) IS DISTINCT FROM (${excluded(labelsTokens.symbol)}, ${excluded(labelsTokens.decimals)}, ${excluded(labelsTokens.logoUrl)})`,
      })
      .returning({ chainId: labelsTokens.chainId });

    return changedRows.length;
  });

  return changedRowCounts.reduce((total, count) => total + count, 0);
};
