import { type Column, eq, type GetColumnData, isNull, type SQL } from 'drizzle-orm';

// Null-safe equality for nullable columns: SQL's `col = NULL` never matches anything (three-valued
// logic), and drizzle's eq() deliberately rejects null comparison values at the type level, so a null
// comparison value needs `IS NULL` instead.
export const eqOrIsNull = <TColumn extends Column>(
  column: TColumn,
  value: GetColumnData<TColumn, 'raw'> | null,
): SQL => {
  return value === null ? isNull(column) : eq(column, value);
};
