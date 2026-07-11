import { type Column, eq, type GetColumnData, isNull, type SQL, sql } from 'drizzle-orm';
import type { DatabaseWriter } from './client';

// Serializes concurrent transactions on the same key: the advisory lock is acquired for the
// remainder of the surrounding transaction and released automatically at commit or rollback.
export const acquireAdvisoryLock = async (writer: DatabaseWriter, key: string): Promise<void> => {
  await writer.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0::bigint))`);
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
