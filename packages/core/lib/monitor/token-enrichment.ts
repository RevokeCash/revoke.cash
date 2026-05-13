import { ERC20_ABI, ERC721_ABI } from '@revoke.cash/core/abis';
import { createViemPublicClientForChain, type DocumentedChainId } from '@revoke.cash/core/chains';
import { type DatabaseWriter, getDb } from '@revoke.cash/core/db/client';
import { monitorEventsCache, monitorTokenMetadata } from '@revoke.cash/core/db/schema/monitor';
import {
  ERC721_APPROVAL_FOR_ALL_TOPIC,
  ERC721_APPROVAL_TOPIC,
  ERC721_TRANSFER_TOPIC,
  PERMIT2_APPROVAL_TOPIC,
  PERMIT2_LOCKDOWN_TOPIC,
  PERMIT2_PERMIT_TOPIC,
} from '@revoke.cash/core/events';
import { getTokenMetadata, type TokenContract, throwIfSpamBytecode } from '@revoke.cash/core/tokens';
import { isSpamError, isTransientError, parseErrorMessage, type SpamReason } from '@revoke.cash/core/utils/errors';
import { and, eq, gte, inArray, isNull, lt, lte, or, type SQL, sql } from 'drizzle-orm';
import { unionAll } from 'drizzle-orm/pg-core';
import { type Address, getAddress, type Hex } from 'viem';
import { isNullish } from '../utils';

export type TokenStandard = (typeof monitorTokenMetadata.tokenStandard.enumValues)[number];

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
  const abi = standard === 'erc721' ? ERC721_ABI : ERC20_ABI;
  const publicClient = createViemPublicClientForChain(chainId);
  const contract = { address: tokenAddress, abi, publicClient } as TokenContract;

  try {
    const [metadata] = await Promise.all([getTokenMetadata(contract, chainId), throwIfSpamBytecode(contract)]);

    await upsertTokenMetadata(getDb(), chainId, tokenAddress, {
      tokenStandard: standard,
      symbol: metadata.symbol,
      decimals: metadata.decimals ?? null,
      totalSupply: metadata.totalSupply ?? null,
      iconUrl: metadata.icon ?? null,
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
  limit?: number;
}

export const findUnenrichedTokens = async (params: UnenrichedTokensQuery): Promise<Address[]> => {
  const { chainId, fromBlock, toBlock, staleBefore, limit = 500 } = params;
  const db = getDb();

  const tokenFromAddress = sql<string>`${monitorEventsCache.address}`.as('token');
  const tokenFromTopic2 = sql<string>`'0x' || substring(${monitorEventsCache.topic2} from 27 for 40)`.as('token');
  const tokenFromData = sql<string>`'0x' || substring(${monitorEventsCache.data} from 27 for 40)`.as('token');

  const inBlockRange =
    !isNullish(fromBlock) && !isNullish(toBlock)
      ? and(gte(monitorEventsCache.blockNumber, fromBlock), lte(monitorEventsCache.blockNumber, toBlock))
      : undefined;

  const tokensFromSource = (tokenExpr: SQL.Aliased<string>, topic0s: readonly Hex[]) =>
    db
      .select({ token: tokenExpr })
      .from(monitorEventsCache)
      .where(and(eq(monitorEventsCache.chainId, chainId), inArray(monitorEventsCache.topic0, topic0s), inBlockRange));

  const observed = unionAll(
    tokensFromSource(tokenFromAddress, [ERC721_APPROVAL_TOPIC, ERC721_APPROVAL_FOR_ALL_TOPIC]),
    tokensFromSource(tokenFromTopic2, [PERMIT2_APPROVAL_TOPIC, PERMIT2_PERMIT_TOPIC]),
    tokensFromSource(tokenFromData, [PERMIT2_LOCKDOWN_TOPIC]),
  ).as('observed');

  const rows = await db
    .selectDistinct({ token: observed.token })
    .from(observed)
    .leftJoin(
      monitorTokenMetadata,
      and(eq(monitorTokenMetadata.chainId, chainId), eq(monitorTokenMetadata.tokenAddress, observed.token)),
    )
    .where(
      or(
        isNull(monitorTokenMetadata.enrichedAt),
        !isNullish(staleBefore) ? lt(monitorTokenMetadata.enrichedAt, staleBefore) : undefined,
      ),
    )
    .limit(limit);

  return rows.map((row) => getAddress(row.token));
};

export const getCachedTokenMetadata = async (
  chainId: DocumentedChainId,
  tokenAddresses: readonly Address[],
): Promise<Map<Address, typeof monitorTokenMetadata.$inferSelect>> => {
  if (tokenAddresses.length === 0) return new Map();
  const rows = await getDb().query.monitorTokenMetadata.findMany({
    where: and(
      eq(monitorTokenMetadata.chainId, chainId),
      inArray(monitorTokenMetadata.tokenAddress, tokenAddresses as Address[]),
    ),
  });
  return new Map(rows.map((row) => [row.tokenAddress, row]));
};

// Check if the token has an ApprovalForAll event OR if its Transfer/Approval events have 4 topic,
// then it is ERC721, otherwise it is ERC20 (note that we don't differentiate between ERC721 and ERC1155 here)
const inferTokenStandardFromEvents = async (chainId: number, tokenAddress: Address): Promise<TokenStandard> => {
  const result = await getDb()
    .select({
      isErc721: sql<boolean>`bool_or(
        ${monitorEventsCache.topic3} IS NOT NULL
        OR ${monitorEventsCache.topic0} = ${ERC721_APPROVAL_FOR_ALL_TOPIC}
      )`,
    })
    .from(monitorEventsCache)
    .where(
      and(
        eq(monitorEventsCache.chainId, chainId),
        eq(monitorEventsCache.address, tokenAddress),
        inArray(monitorEventsCache.topic0, [
          ERC721_APPROVAL_TOPIC,
          ERC721_APPROVAL_FOR_ALL_TOPIC,
          ERC721_TRANSFER_TOPIC,
        ]),
      ),
    );

  if (result[0]?.isErc721) return 'erc721';
  return 'erc20';
};

type UpsertValues = Partial<{
  tokenStandard: TokenStandard;
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
    .insert(monitorTokenMetadata)
    .values({ chainId, tokenAddress, enrichedAt, ...values })
    .onConflictDoUpdate({
      target: [monitorTokenMetadata.chainId, monitorTokenMetadata.tokenAddress],
      set: { enrichedAt, ...values },
    });
};
