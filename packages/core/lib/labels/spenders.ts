// Server-only: reads labels.spenders, and reads every spender fact of the store in one statement.
import { type DatabaseWriter, getDb } from '@revoke.cash/core/db/client';
import { indexerSpenderChecks } from '@revoke.cash/core/db/schema/indexer';
import {
  labelsExploitAddresses,
  labelsExploits,
  labelsScamSnifferBlocklist,
  labelsSpenders,
} from '@revoke.cash/core/db/schema/labels';
import { lowercaseAddressArray } from '@revoke.cash/core/db/types/lowercase-address';
import { nullableColumn } from '@revoke.cash/core/db/utils';
import {
  ALL_CHAINS_CHAIN_ID,
  type SpenderCheck,
  type SpenderLabel,
  type SpenderLabelRiskFactor,
  type SpenderRows,
  splitSpenderLabels,
} from '@revoke.cash/core/labels/merge';
import { scamSnifferAddressHash } from '@revoke.cash/core/labels/scamsniffer';
import type { RiskFactor } from '@revoke.cash/core/risk';
import { and, eq, inArray, not, sql } from 'drizzle-orm';
import { unionAll } from 'drizzle-orm/pg-core';
import { type Address, getAddress } from 'viem';

type SpenderRowKind = 'check' | 'label' | 'exploit' | 'scamsniffer';
type SpenderRow = Awaited<ReturnType<typeof selectSpenderCheckBranch>>[number];
type SpenderLabelRow = Awaited<ReturnType<typeof selectSpenderLabelBranch>>[number];

// Everything the store holds for the given spenders on one chain, in one statement: the check row, the chain and
// all-chains labels, the non-fixed exploits and the ScamSniffer listing. Keyed by checksummed address; addresses
// without any row are left out.
export const getSpenderRows = async (
  chainId: number,
  addresses: readonly Address[],
): Promise<Map<Address, SpenderRows>> => {
  if (addresses.length === 0) return new Map();

  // A ScamSniffer row holds the hash of one of the addresses instead of the address
  const addressesByHash = new Map(addresses.map((address) => [scamSnifferAddressHash(address), getAddress(address)]));
  const db = getDb();

  // The 4 branches of the spender read, every one an index lookup. Each list binds as one array parameter.
  const rows = await unionAll(
    selectSpenderCheckBranch(db, chainId, addresses),
    selectSpenderLabelBranch(db, chainId, addresses),
    selectSpenderExploitBranch(db, chainId, addresses),
    selectSpenderScamSnifferBranch(db, [...addressesByHash.keys()]),
  );
  const rowsByAddress = groupByAddress(rows, (row) => row.address ?? addressesByHash.get(row.scamsnifferHash!)!);

  return new Map([...rowsByAddress].map(([address, addressRows]) => [address, toSpenderRows(addressRows)]));
};

// The labels and the non-fixed exploits of one spender on one chain: the curated data that /generated serves. It reads
// no check or ScamSniffer data.
export const getCuratedSpenderRows = async (
  chainId: number,
  address: Address,
): Promise<Pick<SpenderRows, 'chainLabel' | 'allChainsLabel' | 'exploitNames'>> => {
  const db = getDb();
  const addresses = [address];

  // The label branch goes first, so its real columns decode the address and chain id of every row
  const rows = await unionAll(
    selectSpenderLabelBranch(db, chainId, addresses),
    selectSpenderExploitBranch(db, chainId, addresses),
  );

  return toSpenderRows(rows);
};

// The check branch goes first, because drizzle decodes every row of a union with the first branch's fields: its real
// columns turn the address into a checksummed one and enriched_at into a Date (neon-http returns timestamps as strings)
// for the rows of every branch.
const selectSpenderCheckBranch = (db: DatabaseWriter, chainId: number, addresses: readonly Address[]) =>
  db
    .select({
      address: nullableColumn(indexerSpenderChecks.spenderAddress),
      scamsnifferHash: sql<string | null>`NULL::text`,
      chainId: nullableColumn(indexerSpenderChecks.chainId),
      kind: sql<SpenderRowKind>`'check'`,
      name: indexerSpenderChecks.name,
      labelRiskFactors: sql<SpenderLabelRiskFactor[] | null>`NULL::jsonb`,
      riskFactors: nullableColumn(indexerSpenderChecks.riskFactors),
      exploitName: sql<string | null>`NULL::text`,
      enrichedAt: indexerSpenderChecks.enrichedAt,
    })
    .from(indexerSpenderChecks)
    .where(
      and(
        eq(indexerSpenderChecks.chainId, chainId),
        sql`${indexerSpenderChecks.spenderAddress} = any(${sql.param(addresses, lowercaseAddressArray)}::text[])`,
      ),
    );

// The one place that reads the all-chains rows. It selects the columns of every branch of the spender read, so the
// branches combine with unionAll.
const selectSpenderLabelBranch = (db: DatabaseWriter, chainId: number, addresses: readonly Address[]) =>
  db
    .select({
      address: labelsSpenders.address,
      scamsnifferHash: sql<string | null>`NULL::text`,
      chainId: labelsSpenders.chainId,
      kind: sql<SpenderRowKind>`'label'`,
      name: labelsSpenders.name,
      labelRiskFactors: nullableColumn(labelsSpenders.riskFactors),
      riskFactors: sql<RiskFactor[] | null>`NULL::jsonb`,
      exploitName: sql<string | null>`NULL::text`,
      enrichedAt: sql<Date | null>`NULL::timestamptz`,
    })
    .from(labelsSpenders)
    .where(
      and(
        inArray(labelsSpenders.chainId, [chainId, ALL_CHAINS_CHAIN_ID]),
        sql`${labelsSpenders.address} = any(${sql.param(addresses, lowercaseAddressArray)}::text[])`,
      ),
    );

// The names of the non-fixed exploits that list the addresses on this chain
const selectSpenderExploitBranch = (db: DatabaseWriter, chainId: number, addresses: readonly Address[]) =>
  db
    .select({
      address: labelsExploitAddresses.address,
      scamsnifferHash: sql<string | null>`NULL::text`,
      chainId: labelsExploitAddresses.chainId,
      kind: sql<SpenderRowKind>`'exploit'`,
      name: sql<string | null>`NULL::text`,
      labelRiskFactors: sql<SpenderLabelRiskFactor[] | null>`NULL::jsonb`,
      riskFactors: sql<RiskFactor[] | null>`NULL::jsonb`,
      exploitName: labelsExploits.name,
      enrichedAt: sql<Date | null>`NULL::timestamptz`,
    })
    .from(labelsExploitAddresses)
    .innerJoin(labelsExploits, and(eq(labelsExploits.slug, labelsExploitAddresses.slug), not(labelsExploits.fixed)))
    .where(
      and(
        eq(labelsExploitAddresses.chainId, chainId),
        sql`${labelsExploitAddresses.address} = any(${sql.param(addresses, lowercaseAddressArray)}::text[])`,
      ),
    );

// The listed hashes, on every chain. The address is NULL, because the address decoder of the first branch runs
// getAddress on every non-null value.
const selectSpenderScamSnifferBranch = (db: DatabaseWriter, addressHashes: string[]) =>
  db
    .select({
      address: sql<Address | null>`NULL::text`,
      scamsnifferHash: labelsScamSnifferBlocklist.addressHash,
      chainId: sql<number | null>`NULL::integer`,
      kind: sql<SpenderRowKind>`'scamsniffer'`,
      name: sql<string | null>`NULL::text`,
      labelRiskFactors: sql<SpenderLabelRiskFactor[] | null>`NULL::jsonb`,
      riskFactors: sql<RiskFactor[] | null>`NULL::jsonb`,
      exploitName: sql<string | null>`NULL::text`,
      enrichedAt: sql<Date | null>`NULL::timestamptz`,
    })
    .from(labelsScamSnifferBlocklist)
    .where(
      and(
        sql`${labelsScamSnifferBlocklist.addressHash} = any(${sql.param(addressHashes)}::text[])`,
        not(labelsScamSnifferBlocklist.falsePositive),
      ),
    );

// The rows of one address
const toSpenderRows = (rows: SpenderRow[]): SpenderRows => {
  const checkRow = rows.find((row) => row.kind === 'check');
  const labels = rows.filter(isLabelRow).map(toSpenderLabel);

  return {
    ...splitSpenderLabels(labels),
    check: checkRow ? toSpenderCheck(checkRow) : undefined,
    // Sorted, because the union has no order and the served body should not change between reads
    exploitNames: rows.flatMap((row) => (row.exploitName === null ? [] : [row.exploitName])).sort(),
    scamSnifferListed: rows.some((row) => row.kind === 'scamsniffer'),
  };
};

// Label rows always have an address and a chain id
const isLabelRow = (row: SpenderRow): row is SpenderLabelRow => row.kind === 'label';

const toSpenderLabel = (row: SpenderLabelRow): SpenderLabel => ({
  chainId: row.chainId,
  address: row.address,
  name: row.name,
  riskFactors: row.labelRiskFactors ?? [],
});

const toSpenderCheck = (row: SpenderRow): SpenderCheck => ({
  name: row.name,
  riskFactors: row.riskFactors ?? [],
  enrichedAt: row.enrichedAt,
});

// Map.groupBy, which the es2022 lib of the indexer does not type
const groupByAddress = <TRow>(rows: TRow[], getRowAddress: (row: TRow) => Address): Map<Address, TRow[]> => {
  return rows.reduce((rowsByAddress, row) => {
    const address = getRowAddress(row);
    return rowsByAddress.set(address, [...(rowsByAddress.get(address) ?? []), row]);
  }, new Map<Address, TRow[]>());
};
