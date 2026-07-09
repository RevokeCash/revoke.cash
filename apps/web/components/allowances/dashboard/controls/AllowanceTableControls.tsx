import type { TokenAllowanceData } from '@revoke.cash/core/allowances';
import type { Table } from '@tanstack/react-table';
import { updateTableFilters } from 'lib/utils/table';
import { Suspense, useCallback } from 'react';
import { ColumnId } from '../columns';
import AllowanceSearchBox from './AllowanceSearchBox';
import SortSelect from './SortSelect';

interface Props {
  table: Table<TokenAllowanceData>;
}

const AllowanceTableControls = ({ table }: Props) => {
  const onSearchValuesChange = useCallback(
    (values: string[]) => {
      const tableFilters = values.length > 0 ? [{ id: ColumnId.SPENDER, value: values }] : [];
      const ignoreIds = Object.values(ColumnId).filter((id) => id !== ColumnId.SPENDER);
      updateTableFilters(table, tableFilters, ignoreIds);
    },
    [table],
  );

  return (
    <div className="flex flex-col-reverse md:flex-row gap-2">
      <Suspense>
        <AllowanceSearchBox onSearchValuesChange={onSearchValuesChange} />
      </Suspense>
      <SortSelect onSortChange={table.setSorting} className="md:w-auto" />
    </div>
  );
};

export default AllowanceTableControls;
