/**
 * Diffs the monitor_partitions schema against ORDERED_CHAINS for every partitioned
 * monitor.* table:
 *   - Prints CREATE TABLE ... PARTITION OF ... statements (stdout) for chains in
 *     ORDERED_CHAINS that do not yet have a partition — paste into a new migration.
 *   - Warns (stderr) about orphan partitions: tables in monitor_partitions whose
 *     chain_id is no longer in ORDERED_CHAINS. Dropping or disabling these is a
 *     deliberate decision (data loss vs. historical retention), so this script
 *     only reports them — never auto-drops.
 *
 * Adding a new partitioned table = one line in PARTITIONED_TABLES below.
 *
 * Run with a valid DATABASE_URL set:
 *   packages/core $ yarn env tsx scripts/print-monitor-partitions.ts
 */
import { getChainConfig, ORDERED_CHAINS } from '@revoke.cash/core/chains';
import { getDb } from '@revoke.cash/core/db/client';
import { sql } from 'drizzle-orm';

interface ExistingPartitionRow extends Record<string, unknown> {
  table_name: string;
}

const PARTITIONED_TABLES = ['events_cache'] as const;

const getChainName = (chainId: number): string => {
  try {
    // Cast — the chain may no longer satisfy DocumentedChainId after being removed from config.
    return getChainConfig(chainId as Parameters<typeof getChainConfig>[0]).getName();
  } catch {
    return '(no longer in config)';
  }
};

const diffPartitionsForTable = async (
  db: ReturnType<typeof getDb>,
  tableName: string,
): Promise<{ missing: number[]; orphans: number[]; existingCount: number }> => {
  const prefix = `${tableName}_`;
  const pattern = `${prefix}%`;

  const existing = await db.execute<ExistingPartitionRow>(sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'monitor_partitions'
      AND table_name LIKE ${pattern}
  `);

  const existingChainIds = new Set<number>(
    existing.rows
      .map((row) => Number(row.table_name.slice(prefix.length)))
      .filter((chainId) => Number.isFinite(chainId)),
  );

  const orderedChainIds = new Set<number>(ORDERED_CHAINS);
  const missing = ORDERED_CHAINS.filter((chainId) => !existingChainIds.has(chainId));
  const orphans = [...existingChainIds].filter((chainId) => !orderedChainIds.has(chainId));

  return { missing, orphans, existingCount: existingChainIds.size };
};

const main = async () => {
  const db = getDb();

  const allStatements: string[] = [];
  let totalMissing = 0;
  let totalOrphans = 0;

  for (const tableName of PARTITIONED_TABLES) {
    const { missing, orphans, existingCount } = await diffPartitionsForTable(db, tableName);

    console.error(
      `monitor_partitions.${tableName}_*: ${existingCount} existing, ${ORDERED_CHAINS.length} in ORDERED_CHAINS, ${missing.length} missing, ${orphans.length} orphan(s).`,
    );

    if (orphans.length > 0) {
      console.error(`\n${orphans.length} orphan ${tableName} partition(s) (chain no longer in ORDERED_CHAINS):`);
      for (const chainId of orphans) {
        console.error(`  monitor_partitions.${tableName}_${chainId}   -- was: ${getChainName(chainId)}`);
      }
      console.error(
        '\nReview each:\n' +
          '  - Soft-disable (preserve history): UPDATE monitor.scan_state SET disabled_at = now() WHERE chain_id = <X>;\n' +
          `  - Hard-remove (drop data): ALTER TABLE monitor.${tableName} DETACH PARTITION monitor_partitions.${tableName}_<X>; DROP TABLE monitor_partitions.${tableName}_<X>;\n`,
      );
    }

    if (missing.length > 0) {
      const header = `-- monitor.${tableName}`;
      const statements = missing.map(
        (chainId) =>
          `CREATE TABLE "monitor_partitions"."${tableName}_${chainId}" PARTITION OF "monitor"."${tableName}" FOR VALUES IN (${chainId}); -- ${getChainName(chainId)}`,
      );
      allStatements.push([header, ...statements].join('\n'));
    }

    totalMissing += missing.length;
    totalOrphans += orphans.length;
  }

  if (totalMissing === 0) {
    console.error(`\nNo partitions to create${totalOrphans > 0 ? ' (orphans noted above)' : ''}.`);
    return;
  }

  console.log(allStatements.join('\n\n'));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
