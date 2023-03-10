import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import { ColumnId, columns } from 'components/allowances/table/columns';
import { useAddressAllowances } from 'lib/hooks/page-context/AddressPageContext';
import type { AllowanceData } from 'lib/interfaces';
import AllowanceTableBody from './AllowanceTableBody';
import AllowanceTableHeader from './header/AllowanceTableHeader';

const AllowanceTable = () => {
  const { allowances, isLoading, error, onUpdate } = useAddressAllowances();

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
        [ColumnId.BALANCE]: false,
      },
    },
  });

  return (
    <div className="flex flex-col justify-start mx-auto gap-2">
      <AllowanceTableHeader table={table} />
      <AllowanceTableBody table={table} loading={isLoading} error={error} allowances={allowances} />
    </div>
  );
};

export default AllowanceTable;
