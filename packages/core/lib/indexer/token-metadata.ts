import { createViemPublicClientForChain, type DocumentedChainId } from '@revoke.cash/core/chains';
import { type DatabaseWriter, getDb } from '@revoke.cash/core/db/client';
import { indexerEvents, indexerTokenMetadata } from '@revoke.cash/core/db/schema/indexer';
import { labelsTokens } from '@revoke.cash/core/db/schema/labels';
import { lowercaseAddressArray } from '@revoke.cash/core/db/types/lowercase-address';
import { nullableColumn } from '@revoke.cash/core/db/utils';
import {
  ERC721_APPROVAL_FOR_ALL_TOPIC,
  ERC721_APPROVAL_TOPIC,
  ERC721_TRANSFER_TOPIC,
  PERMIT2_APPROVAL_TOPIC,
  PERMIT2_LOCKDOWN_TOPIC,
  PERMIT2_PERMIT_TOPIC,
} from '@revoke.cash/core/events';
import { type MergedTokenMetadata, mergeTokenMetadata, toPublicTokenLabel } from '@revoke.cash/core/labels/merge';
import { getTokenLabel } from '@revoke.cash/core/labels/tokens';
import {
  getTokenMetadata,
  type TokenMetadata,
  type TokenReference,
  type TokenStandard,
} from '@revoke.cash/core/tokens';
import { isSpamError, isTransientError, parseErrorMessage, type SpamReason } from '@revoke.cash/core/utils/errors';
import { mapAsyncBounded } from '@revoke.cash/core/utils/promises';
import { and, eq, gte, inArray, isNull, lt, lte, or, type SQL, sql } from 'drizzle-orm';
import { unionAll } from 'drizzle-orm/pg-core';
import { type Address, getAddress, type Hex } from 'viem';
import { deduplicateArray, isNullish } from '../utils';

// An enriched token: its computed row exists, so it has a standard (isUsableTokenMetadata)
export type UsableTokenMetadata = MergedTokenMetadata & { tokenStandard: TokenStandard };
export type TokenMetadataByAddress = Map<Address, MergedTokenMetadata>;

type TokenRowKind = 'computed' | 'label';

export interface TokenEnrichmentResult {
  durationMs: number;
  outcome: 'enriched' | 'spam' | 'error';
}

export const enrichToken = async (
  chainId: DocumentedChainId,
  tokenAddress: Address,
): Promise<TokenEnrichmentResult> => {
  const start = Date.now();

  const standard = await inferTokenStandardFromEvents(chainId, tokenAddress);
  const publicClient = createViemPublicClientForChain(chainId);
  const token: TokenReference = { address: tokenAddress, standard };

  // Read before the try, so a database error fails the check and nothing is written
  const tokenLabel = await getTokenLabel(chainId, tokenAddress);
  const publicTokenLabel = tokenLabel && toPublicTokenLabel(tokenLabel);

  try {
    const metadata = await getTokenMetadata(token, publicClient, chainId, publicTokenLabel);

    await upsertTokenMetadata(getDb(), chainId, tokenAddress, {
      tokenStandard: standard,
      symbol: metadata.symbol,
      decimals: metadata.decimals ?? null,
      totalSupply: metadata.totalSupply ?? null,
      iconUrl: metadata.logoUrl ?? null,
      spamReason: null,
      enrichmentError: null,
    });
    return { durationMs: Date.now() - start, outcome: 'enriched' };
  } catch (error) {
    // Transient failures bubble up so BullMQ retries handle them.
    if (isTransientError(error)) throw error;

    const isSpam = isSpamError(error);
    await upsertTokenMetadata(getDb(), chainId, tokenAddress, {
      tokenStandard: standard,
      spamReason: isSpam ? error.reason : null,
      enrichmentError: isSpam ? null : parseErrorMessage(error),
    });
    return { durationMs: Date.now() - start, outcome: isSpam ? 'spam' : 'error' };
  }
};

export interface UnenrichedTokensQuery {
  chainId: DocumentedChainId;
  fromBlock?: number;
  toBlock?: number;
  staleBefore?: Date;
  limit?: number | null;
}

export const findUnenrichedTokens = async (params: UnenrichedTokensQuery): Promise<Address[]> => {
  const { chainId, fromBlock, toBlock, staleBefore } = params;
  const limit = params.limit === undefined ? 500 : params.limit;
  const db = getDb();

  const tokenFromAddress = sql<string>`${indexerEvents.address}`.as('token');
  const tokenFromTopic2 = sql<string>`'0x' || substring(${indexerEvents.topic2} from 27 for 40)`.as('token');
  const tokenFromData = sql<string>`'0x' || substring(${indexerEvents.data} from 27 for 40)`.as('token');

  const inBlockRange =
    !isNullish(fromBlock) && !isNullish(toBlock)
      ? and(gte(indexerEvents.blockNumber, fromBlock), lte(indexerEvents.blockNumber, toBlock))
      : undefined;

  const tokensFromSource = (tokenExpr: SQL.Aliased<string>, topic0s: readonly Hex[]) =>
    db
      .select({ token: tokenExpr })
      .from(indexerEvents)
      .where(and(eq(indexerEvents.chainId, chainId), inArray(indexerEvents.topic0, topic0s), inBlockRange));

  const observed = unionAll(
    tokensFromSource(tokenFromAddress, [ERC721_APPROVAL_TOPIC, ERC721_APPROVAL_FOR_ALL_TOPIC]),
    tokensFromSource(tokenFromTopic2, [PERMIT2_APPROVAL_TOPIC, PERMIT2_PERMIT_TOPIC]),
    tokensFromSource(tokenFromData, [PERMIT2_LOCKDOWN_TOPIC]),
  ).as('observed');

  const query = db
    .selectDistinct({ token: observed.token })
    .from(observed)
    .leftJoin(
      indexerTokenMetadata,
      and(eq(indexerTokenMetadata.chainId, chainId), eq(indexerTokenMetadata.tokenAddress, observed.token)),
    )
    .where(
      or(
        isNull(indexerTokenMetadata.enrichedAt),
        !isNullish(staleBefore) ? lt(indexerTokenMetadata.enrichedAt, staleBefore) : undefined,
      ),
    );

  const rows = isNullish(limit) ? await query : await query.limit(limit);

  return rows.map((row) => getAddress(row.token));
};

export const getCachedTokenMetadata = async (
  chainId: DocumentedChainId,
  tokenAddresses: readonly Address[],
): Promise<TokenMetadataByAddress> => {
  if (tokenAddresses.length === 0) return new Map();

  const db = getDb();

  // The computed branch goes first, because drizzle decodes every row of a union with the first branch's fields: its
  // real columns turn the address into a checksummed one, total_supply into a bigint and enriched_at into a Date
  const rows = await unionAll(
    selectComputedTokenBranch(db, chainId, tokenAddresses),
    selectTokenLabelBranch(db, chainId, tokenAddresses),
  );

  // An address has at most one row in each branch
  const computedRows = new Map(rows.filter((row) => row.kind === 'computed').map((row) => [row.address, row]));
  const labelRows = new Map(rows.filter((row) => row.kind === 'label').map((row) => [row.address, row]));
  const addresses = deduplicateArray(rows.map((row) => row.address));

  return new Map(
    addresses.map((address) => {
      const metadata = mergeTokenMetadata(address, computedRows.get(address), labelRows.get(address));
      return [address, metadata];
    }),
  );
};

export const getCompleteTokenMetadata = async (
  chainId: DocumentedChainId,
  tokenAddresses: readonly Address[],
): Promise<TokenMetadataByAddress> => {
  const metadataByToken = await getCachedTokenMetadata(chainId, tokenAddresses);
  const missingTokens = tokenAddresses.filter((token) => isNullish(metadataByToken.get(token)?.enrichedAt));

  if (missingTokens.length === 0) return metadataByToken;

  await mapAsyncBounded(missingTokens, 10, (token) => enrichToken(chainId, token));
  return getCachedTokenMetadata(chainId, tokenAddresses);
};

export const isUsableTokenMetadata = (metadata?: MergedTokenMetadata): metadata is UsableTokenMetadata => {
  if (metadata === undefined) return false;
  if (isNullish(metadata.tokenStandard)) return false;
  if (isNullish(metadata.enrichedAt)) return false;
  if (!isNullish(metadata.enrichmentError)) return false;
  if (!isNullish(metadata.spamReason)) return false;
  return true;
};

export const serializeTokenMetadata = (metadata: MergedTokenMetadata): TokenMetadata => ({
  symbol: metadata.symbol ?? metadata.tokenAddress,
  decimals: metadata.decimals ?? undefined,
  totalSupply: metadata.totalSupply ?? undefined,
  logoUrl: metadata.logoUrl ?? undefined,
});

const selectComputedTokenBranch = (
  db: DatabaseWriter,
  chainId: DocumentedChainId,
  tokenAddresses: readonly Address[],
) =>
  db
    .select({
      address: indexerTokenMetadata.tokenAddress,
      kind: sql<TokenRowKind>`'computed'`,
      // Nullable, because the label branch has NULL here
      tokenStandard: nullableColumn(indexerTokenMetadata.tokenStandard),
      symbol: indexerTokenMetadata.symbol,
      decimals: indexerTokenMetadata.decimals,
      totalSupply: indexerTokenMetadata.totalSupply,
      logoUrl: sql<string | null>`NULL::text`,
      isSpam: sql<boolean | null>`NULL::boolean`,
      spamReason: indexerTokenMetadata.spamReason,
      enrichmentError: indexerTokenMetadata.enrichmentError,
      enrichedAt: indexerTokenMetadata.enrichedAt,
    })
    .from(indexerTokenMetadata)
    .where(
      and(
        eq(indexerTokenMetadata.chainId, chainId),
        sql`${indexerTokenMetadata.tokenAddress} = any(${sql.param(tokenAddresses, lowercaseAddressArray)}::text[])`,
      ),
    );

// The read selects no note or timestamps, because the merge does not use them. The untyped NULLs take the types of the
// computed branch, which include the token_standard and spam_reason enums
const selectTokenLabelBranch = (db: DatabaseWriter, chainId: DocumentedChainId, tokenAddresses: readonly Address[]) =>
  db
    .select({
      address: labelsTokens.address,
      kind: sql<TokenRowKind>`'label'`,
      tokenStandard: sql<null>`NULL`,
      symbol: labelsTokens.symbol,
      decimals: labelsTokens.decimals,
      totalSupply: sql<null>`NULL`,
      logoUrl: labelsTokens.logoUrl,
      isSpam: labelsTokens.isSpam,
      spamReason: sql<null>`NULL`,
      enrichmentError: sql<null>`NULL`,
      enrichedAt: sql<null>`NULL`,
    })
    .from(labelsTokens)
    .where(
      and(
        eq(labelsTokens.chainId, chainId),
        sql`${labelsTokens.address} = any(${sql.param(tokenAddresses, lowercaseAddressArray)}::text[])`,
      ),
    );

// Check if the token has an ApprovalForAll event OR if its Transfer/Approval events have 4 topic,
// then it is ERC721, otherwise it is ERC20 (note that we don't differentiate between ERC721 and ERC1155 here)
const inferTokenStandardFromEvents = async (chainId: number, tokenAddress: Address): Promise<TokenStandard> => {
  const result = await getDb()
    .select({
      isErc721: sql<boolean>`bool_or(
        ${indexerEvents.topic3} IS NOT NULL
        OR ${indexerEvents.topic0} = ${ERC721_APPROVAL_FOR_ALL_TOPIC}
      )`,
    })
    .from(indexerEvents)
    .where(
      and(
        eq(indexerEvents.chainId, chainId),
        eq(indexerEvents.address, tokenAddress),
        inArray(indexerEvents.topic0, [ERC721_APPROVAL_TOPIC, ERC721_APPROVAL_FOR_ALL_TOPIC, ERC721_TRANSFER_TOPIC]),
      ),
    );

  if (result[0]?.isErc721) return 'erc721';
  return 'erc20';
};

type UpsertValues = { tokenStandard: TokenStandard } & Partial<{
  symbol: string | null;
  decimals: number | null;
  totalSupply: bigint | null;
  iconUrl: string | null;
  spamReason: SpamReason | null;
  enrichmentError: string | null;
}>;

const upsertTokenMetadata = async (
  writer: DatabaseWriter,
  chainId: DocumentedChainId,
  tokenAddress: Address,
  values: UpsertValues,
): Promise<void> => {
  const enrichedAt = new Date();
  await writer
    .insert(indexerTokenMetadata)
    .values({ chainId, tokenAddress, enrichedAt, ...values })
    .onConflictDoUpdate({
      target: [indexerTokenMetadata.chainId, indexerTokenMetadata.tokenAddress],
      set: { enrichedAt, ...values },
    });
};
