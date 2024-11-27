import { ColumnFiltersState, Table } from '@tanstack/react-table';
import { TokenAllowanceData } from 'lib/utils/allowances';
import { deduplicateArray } from '.';

export const updateTableFilters = (
  table: Table<TokenAllowanceData>,
  newFilters: ColumnFiltersState,
  ignoreIds: string[] = [],
) => {
  table.setColumnFilters((oldFilters) => {
    const keepOldFilters = oldFilters.filter((filter) => ignoreIds.includes(filter.id));
    const allFilters = [...keepOldFilters, ...newFilters];
    const uniqueFilters = deduplicateArray(allFilters, (a, b) => a.id === b.id);
    return uniqueFilters;
  });
};
