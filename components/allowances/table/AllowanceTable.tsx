import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import { ColumnId, columns } from 'components/allowances/table/columns';
import { useAddressContext } from 'lib/hooks/useAddressContext';
import { useAllowances } from 'lib/hooks/useAllowances';
import type { AllowanceData } from 'lib/interfaces';
import AllowanceTableBody from './AllowanceTableBody';
import AllowanceTableHeader from './AllowanceTableHeader';

// TODO: It's always using the Infura provider, even if it could be using the injected provider

const AllowanceTable = () => {
  const { address } = useAddressContext();
  const { allowances, loading, error, onUpdate } = useAllowances(address);
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
    <div className="flex flex-col justify-start w-fit mx-auto gap-2">
      <AllowanceTableHeader table={table} />
      <AllowanceTableBody table={table} loading={loading} error={error} allowances={allowances} />
    </div>
  );
};

export default AllowanceTable;
