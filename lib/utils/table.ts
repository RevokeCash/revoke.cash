import type { ColumnFiltersState, Table } from '@tanstack/react-table';
import type { TokenAllowanceData } from 'lib/utils/allowances';
import { deduplicateArray } from '.';

export const updateTableFilters = (
  table: Table<TokenAllowanceData>,
  newFilters: ColumnFiltersState,
  ignoreIds: string[] = [],
) => {
  table.setColumnFilters((oldFilters) => {
    const keepOldFilters = oldFilters.filter((filter) => ignoreIds.includes(filter.id));
    const allFilters = [...keepOldFilters, ...newFilters];
    const uniqueFilters = deduplicateArray(allFilters, (filter) => filter.id);
    return uniqueFilters;
  });
};
