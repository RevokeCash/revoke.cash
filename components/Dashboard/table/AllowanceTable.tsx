import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import { ColumnId, columns } from 'components/Dashboard/table/columns';
import { useAllowances } from 'lib/hooks/useAllowances';
import { useAppContext } from 'lib/hooks/useAppContext';
import type { AllowanceData } from 'lib/interfaces';
import AllowanceTableBody from './AllowanceTableBody';
import AllowanceTableHeader from './AllowanceTableHeader';

const AllowanceTable = () => {
  const { inputAddress } = useAppContext();
  const { allowances, loading, error, onUpdate } = useAllowances(inputAddress);
  const table = useReactTable({
    data: allowances,
    columns,
    getCoreRowModel: getCoreRowModel<AllowanceData>(),
    getSortedRowModel: getSortedRowModel<AllowanceData>(),
    getFilteredRowModel: getFilteredRowModel<AllowanceData>(),
    getRowId(row) {
      return `${row.contract.address}-${row.spender}-${row.tokenId}`;
    },
    meta: { onUpdate },
    initialState: {
      sorting: [{ id: ColumnId.SYMBOL, desc: false }],
      columnVisibility: {
        Balance: false,
      },
    },
  });

  return (
    <div className="flex flex-col gap-2">
      <AllowanceTableHeader table={table} />
      <AllowanceTableBody table={table} loading={loading} error={error} allowances={allowances} />
    </div>
  );
};

export default AllowanceTable;
