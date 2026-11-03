import { ADDRESS_ZERO, WEBACY_API_KEY } from '@revoke.cash/core/constants';
import { type DatabaseWriter, getDb } from '@revoke.cash/core/db/client';
import { indexerEvents, indexerSpenderChecks } from '@revoke.cash/core/db/schema/indexer';
import {
  ERC721_APPROVAL_FOR_ALL_TOPIC,
  ERC721_APPROVAL_TOPIC,
  PERMIT2_APPROVAL_TOPIC,
  PERMIT2_LOCKDOWN_TOPIC,
  PERMIT2_PERMIT_TOPIC,
} from '@revoke.cash/core/events';
import { addressToTopic } from '@revoke.cash/core/events/utils';
import {
  getRiskFactorKey,
  type MergedSpenderMetadata,
  mergeSpenderRows,
  type SpenderCheck,
} from '@revoke.cash/core/labels/merge';
import { getSpenderRows } from '@revoke.cash/core/labels/spenders';
import type { RiskFactor } from '@revoke.cash/core/risk';
import { deduplicateArray, isNullish } from '@revoke.cash/core/utils';
import { parseErrorMessage } from '@revoke.cash/core/utils/errors';
import { mapAsyncBounded } from '@revoke.cash/core/utils/promises';
import { DAY } from '@revoke.cash/core/utils/time';
import type { SpenderData } from '@revoke.cash/core/whois';
import { OnchainSpenderCheck } from '@revoke.cash/core/whois/spender/risk/OnchainSpenderCheck';
import { WebacySpenderCheck } from '@revoke.cash/core/whois/spender/risk/WebacySpenderCheck';
import { and, eq, gte, inArray, isNull, lt, lte, or, type SQL, sql } from 'drizzle-orm';
import { unionAll } from 'drizzle-orm/pg-core';
import { type Address, getAddress, type Hex } from 'viem';

// Only revoke.cash's own checks. Names, curated risk, exploits and ScamSniffer are labels.* rows, joined at read time.
const SPENDER_CHECKS = [new OnchainSpenderCheck(), new WebacySpenderCheck(WEBACY_API_KEY)];

export const SPENDER_METADATA_STALE_AFTER_MS = 1 * DAY;

export const isSpenderMetadataFresh = (metadata?: MergedSpenderMetadata): boolean => {
  if (isNullish(metadata?.enrichedAt)) return false;
  return metadata.enrichedAt.getTime() >= Date.now() - SPENDER_METADATA_STALE_AFTER_MS;
};

export type SpenderMetadataByAddress = Map<Address, MergedSpenderMetadata>;

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
    const { name, riskFactors } = await checkSpender(spenderAddress, chainId);

    await upsertSpenderCheck(db, chainId, spenderAddress, { name, riskFactors, enrichmentError: null });

    return { durationMs: Date.now() - start, outcome: 'enriched' };
  } catch (error) {
    await upsertSpenderCheck(db, chainId, spenderAddress, {
      enrichmentError: parseErrorMessage(error),
    });

    return { durationMs: Date.now() - start, outcome: 'error' };
  }
};

// A rejected or empty check adds nothing. The first check that sets a name wins (today only the on-chain check does).
const checkSpender = async (
  spenderAddress: Address,
  chainId: number,
): Promise<Pick<SpenderCheck, 'name' | 'riskFactors'>> => {
  const settlements = await Promise.allSettled(
    SPENDER_CHECKS.map((check) => check.getSpenderData(spenderAddress, chainId)),
  );

  const results = settlements.flatMap((settlement) =>
    settlement.status === 'fulfilled' && settlement.value ? [settlement.value] : [],
  );

  return {
    name: results.find((result) => !isNullish(result.name))?.name ?? null,
    riskFactors: deduplicateArray(
      results.flatMap((result) => result.riskFactors ?? []),
      getRiskFactorKey,
    ),
  };
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
      indexerSpenderChecks,
      and(eq(indexerSpenderChecks.chainId, chainId), eq(indexerSpenderChecks.spenderAddress, observed.spender)),
    )
    .where(
      and(
        sql`${observed.spender} <> ${ADDRESS_ZERO}`,
        or(
          isNull(indexerSpenderChecks.enrichedAt),
          !isNullish(staleBefore) ? lt(indexerSpenderChecks.enrichedAt, staleBefore) : undefined,
        ),
      ),
    );

  const rows = isNullish(limit) ? await query : await query.limit(limit);

  return rows.map((row) => getAddress(row.spenderAddress));
};

// One statement for the check rows, labels, exploits and ScamSniffer, merged per spender
export const getCachedSpenderMetadata = async (
  chainId: number,
  spenderAddresses: readonly Address[],
): Promise<SpenderMetadataByAddress> => {
  const rowsBySpender = await getSpenderRows(chainId, spenderAddresses);

  return new Map([...rowsBySpender].map(([spenderAddress, rows]) => [spenderAddress, mergeSpenderRows(rows)]));
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

export const serializeSpenderMetadata = (metadata?: MergedSpenderMetadata): SpenderData | undefined => {
  if (isNullish(metadata?.enrichedAt)) return undefined;

  return {
    name: metadata.name ?? undefined,
    riskFactors: metadata.riskFactors,
  };
};

type UpsertValues = Partial<{
  name: string | null;
  riskFactors: RiskFactor[];
  enrichmentError: string | null;
}>;

const upsertSpenderCheck = async (
  writer: DatabaseWriter,
  chainId: number,
  spenderAddress: Address,
  values: UpsertValues,
): Promise<void> => {
  const enrichedAt = new Date();

  await writer
    .insert(indexerSpenderChecks)
    .values({ chainId, spenderAddress, enrichedAt, ...values })
    .onConflictDoUpdate({
      target: [indexerSpenderChecks.chainId, indexerSpenderChecks.spenderAddress],
      set: { enrichedAt, ...values },
    });
};
