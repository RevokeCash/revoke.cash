import type { Table } from '@tanstack/react-table';
import type { TokenAllowanceData } from 'lib/utils/allowances';
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
    <div className="flex flex-col gap-2">
      <SortSelect onSortChange={table.setSorting} />
      <Suspense>
        <AllowanceSearchBox onSearchValuesChange={onSearchValuesChange} />
      </Suspense>
    </div>
  );
};

export default AllowanceTableControls;
