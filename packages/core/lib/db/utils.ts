import { type Column, eq, type GetColumnData, isNull, type SQL, sql } from 'drizzle-orm';
import type { DatabaseWriter } from './client';

// Serializes concurrent transactions on the same key: the advisory lock is acquired for the
// remainder of the surrounding transaction and released automatically at commit or rollback.
export const acquireAdvisoryLock = async (writer: DatabaseWriter, key: string): Promise<void> => {
  await writer.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0::bigint))`);
};

// Drizzle wraps driver errors, so the Postgres unique-violation code (23505) lives on the cause
// chain; pass an index name to match violations of one specific constraint
export const isUniqueViolationError = (error: unknown, indexName?: string): boolean => {
  let current = error as { code?: string; message?: string; cause?: unknown } | undefined;

  for (let depth = 0; current && depth < 5; depth++) {
    const matchesIndex = !indexName || current.message?.includes(indexName);
    if (current.code === '23505' && matchesIndex) return true;
    if (indexName && current.message?.includes(indexName)) return true;
    current = current.cause as typeof current;
  }

  return false;
};

// Null-safe equality for nullable columns: SQL's `col = NULL` never matches anything (three-valued
// logic), and drizzle's eq() deliberately rejects null comparison values at the type level, so a null
// comparison value needs `IS NULL` instead.
export const eqOrIsNull = <TColumn extends Column>(
  column: TColumn,
  value: GetColumnData<TColumn, 'raw'> | null,
): SQL => {
  return value === null ? isNull(column) : eq(column, value);
};
