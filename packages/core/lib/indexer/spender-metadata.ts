import { ADDRESS_ZERO, WEBACY_API_KEY } from '@revoke.cash/core/constants';
import { type DatabaseWriter, getDb } from '@revoke.cash/core/db/client';
import { indexerEvents, indexerSpenderMetadata } from '@revoke.cash/core/db/schema/indexer';
import {
  ERC721_APPROVAL_FOR_ALL_TOPIC,
  ERC721_APPROVAL_TOPIC,
  PERMIT2_APPROVAL_TOPIC,
  PERMIT2_LOCKDOWN_TOPIC,
  PERMIT2_PERMIT_TOPIC,
} from '@revoke.cash/core/events';
import { addressToTopic } from '@revoke.cash/core/events/utils';
import type { RiskFactor } from '@revoke.cash/core/risk';
import type { AddressOnChain } from '@revoke.cash/core/types';
import { isNullish } from '@revoke.cash/core/utils';
import { parseErrorMessage } from '@revoke.cash/core/utils/errors';
import { mapAsyncBounded } from '@revoke.cash/core/utils/promises';
import type { SpenderRiskData } from '@revoke.cash/core/whois';
import {
  AggregateSpenderDataSource,
  AggregationType,
} from '@revoke.cash/core/whois/spender/AggregateSpenderDataSource';
import { WhoisSpenderDataSource } from '@revoke.cash/core/whois/spender/label/WhoisSpenderDataSource';
import { OnchainSpenderRiskDataSource } from '@revoke.cash/core/whois/spender/risk/OnchainSpenderRiskDataSource';
import { ScamSnifferRiskDataSource } from '@revoke.cash/core/whois/spender/risk/ScamSnifferRiskDataSource';
import { WebacySpenderRiskDataSource } from '@revoke.cash/core/whois/spender/risk/WebacySpenderRiskDataSource';
import { and, eq, gte, inArray, isNull, lt, lte, or, type SQL, sql } from 'drizzle-orm';
import { unionAll } from 'drizzle-orm/pg-core';
import { type Address, getAddress, type Hex } from 'viem';

const SPENDER_DATA_SOURCE = new AggregateSpenderDataSource({
  aggregationType: AggregationType.PARALLEL_COMBINED,
  sources: [
    new WhoisSpenderDataSource(),
    new OnchainSpenderRiskDataSource(),
    new ScamSnifferRiskDataSource(),
    new WebacySpenderRiskDataSource(WEBACY_API_KEY),
  ],
});

export type SpenderMetadataRow = typeof indexerSpenderMetadata.$inferSelect;
export type SpenderMetadataByAddress = Map<Address, SpenderMetadataRow>;

export interface SpenderEnrichmentResult {
  durationMs: number;
  outcome: 'enriched' | 'error';
}

export interface UnenrichedSpendersQuery {
  chainId: number;
  address?: Address;
  fromBlock?: number;
  toBlock?: number;
  staleBefore?: Date;
  limit?: number | null;
}

export const enrichSpender = async (chainId: number, spenderAddress: Address): Promise<SpenderEnrichmentResult> => {
  const start = Date.now();
  const db = getDb();

  try {
    const spenderData = await SPENDER_DATA_SOURCE.getSpenderData(spenderAddress, chainId);

    await upsertSpenderMetadata(db, chainId, spenderAddress, {
      name: spenderData?.name ?? null,
      riskFactors: spenderData?.riskFactors ?? [],
      enrichmentError: null,
    });

    return { durationMs: Date.now() - start, outcome: 'enriched' };
  } catch (error) {
    await upsertSpenderMetadata(db, chainId, spenderAddress, {
      enrichmentError: parseErrorMessage(error),
    });

    return { durationMs: Date.now() - start, outcome: 'error' };
  }
};

export const findUnenrichedSpenders = async (params: UnenrichedSpendersQuery): Promise<Address[]> => {
  const { chainId, address, fromBlock, toBlock, staleBefore } = params;
  const limit = params.limit === undefined ? 500 : params.limit;
  const db = getDb();
  const spenderFromTopic2 = sql<string>`'0x' || substring(${indexerEvents.topic2} from 27 for 40)`.as('spender');
  const spenderFromTopic3 = sql<string>`'0x' || substring(${indexerEvents.topic3} from 27 for 40)`.as('spender');
  const spenderFromSecondDataWord = sql<string>`'0x' || substring(${indexerEvents.data} from 91 for 40)`.as('spender');

  const inBlockRange =
    !isNullish(fromBlock) && !isNullish(toBlock)
      ? and(gte(indexerEvents.blockNumber, fromBlock), lte(indexerEvents.blockNumber, toBlock))
      : undefined;

  const fromUser = address ? eq(indexerEvents.topic1, addressToTopic(address)) : undefined;

  const spendersFromSource = (spenderExpr: SQL.Aliased<string>, topic0s: readonly Hex[]) =>
    db
      .select({ spender: spenderExpr })
      .from(indexerEvents)
      .where(and(eq(indexerEvents.chainId, chainId), fromUser, inBlockRange, inArray(indexerEvents.topic0, topic0s)));

  const observed = unionAll(
    spendersFromSource(spenderFromTopic2, [ERC721_APPROVAL_TOPIC, ERC721_APPROVAL_FOR_ALL_TOPIC]),
    spendersFromSource(spenderFromTopic3, [PERMIT2_APPROVAL_TOPIC, PERMIT2_PERMIT_TOPIC]),
    spendersFromSource(spenderFromSecondDataWord, [PERMIT2_LOCKDOWN_TOPIC]),
  ).as('observed');

  const query = db
    .selectDistinct({ spenderAddress: observed.spender })
    .from(observed)
    .leftJoin(
      indexerSpenderMetadata,
      and(eq(indexerSpenderMetadata.chainId, chainId), eq(indexerSpenderMetadata.spenderAddress, observed.spender)),
    )
    .where(
      and(
        sql`${observed.spender} <> ${ADDRESS_ZERO}`,
        or(
          isNull(indexerSpenderMetadata.enrichedAt),
          !isNullish(staleBefore) ? lt(indexerSpenderMetadata.enrichedAt, staleBefore) : undefined,
        ),
      ),
    );

  const rows = isNullish(limit) ? await query : await query.limit(limit);

  return rows.map((row) => getAddress(row.spenderAddress));
};

export const getCachedSpenderMetadata = async (
  chainId: number,
  spenderAddresses: readonly Address[],
): Promise<SpenderMetadataByAddress> => {
  if (spenderAddresses.length === 0) return new Map();

  const rows = await getDb().query.indexerSpenderMetadata.findMany({
    where: and(
      eq(indexerSpenderMetadata.chainId, chainId),
      inArray(indexerSpenderMetadata.spenderAddress, spenderAddresses as Address[]),
    ),
  });

  return new Map(rows.map((row) => [row.spenderAddress, row]));
};

export const getCompleteSpenderMetadata = async (
  chainId: number,
  spenderAddresses: readonly Address[],
): Promise<SpenderMetadataByAddress> => {
  const metadataBySpender = await getCachedSpenderMetadata(chainId, spenderAddresses);
  const missingSpenders = spenderAddresses.filter((spender) => isNullish(metadataBySpender.get(spender)?.enrichedAt));

  if (missingSpenders.length === 0) return metadataBySpender;

  await mapAsyncBounded(missingSpenders, 10, (spender) => enrichSpender(chainId, spender));
  return getCachedSpenderMetadata(chainId, spenderAddresses);
};

export const serializeSpenderMetadata = (metadata?: SpenderMetadataRow): SpenderRiskData | undefined => {
  if (isNullish(metadata?.enrichedAt)) return undefined;

  return {
    name: metadata.name ?? undefined,
    riskFactors: metadata.riskFactors,
  };
};

export const addSpenderRiskFactor = async (targets: AddressOnChain[], riskFactor: RiskFactor): Promise<void> => {
  if (targets.length === 0) return;

  const enrichedAt = new Date();
  const riskFactorJson = JSON.stringify([riskFactor]);

  await getDb()
    .insert(indexerSpenderMetadata)
    .values(
      targets.map(({ chainId, address }) => ({
        chainId,
        spenderAddress: address,
        enrichedAt,
        riskFactors: [riskFactor],
      })),
    )
    // The set / setWhere SQL statements make sure that the new riskFactor is appended only if it's not already present.
    .onConflictDoUpdate({
      target: [indexerSpenderMetadata.chainId, indexerSpenderMetadata.spenderAddress],
      set: { enrichedAt, riskFactors: sql`${indexerSpenderMetadata.riskFactors} || ${riskFactorJson}::jsonb` },
      setWhere: sql`not (${indexerSpenderMetadata.riskFactors} @> ${riskFactorJson}::jsonb)`,
    });
};

type UpsertValues = Partial<{
  name: string | null;
  riskFactors: RiskFactor[];
  enrichmentError: string | null;
}>;

const upsertSpenderMetadata = async (
  writer: DatabaseWriter,
  chainId: number,
  spenderAddress: Address,
  values: UpsertValues,
): Promise<void> => {
  const enrichedAt = new Date();

  await writer
    .insert(indexerSpenderMetadata)
    .values({ chainId, spenderAddress, enrichedAt, ...values })
    .onConflictDoUpdate({
      target: [indexerSpenderMetadata.chainId, indexerSpenderMetadata.spenderAddress],
      set: { enrichedAt, ...values },
    });
};
