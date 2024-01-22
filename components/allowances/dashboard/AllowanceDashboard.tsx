import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import { ColumnId, columns } from 'components/allowances/dashboard/columns';
import { useAddressAllowances, useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import type { AllowanceData } from 'lib/interfaces';
import AllowanceTableControls from './controls/AllowanceTableControls';
import AllowanceTable from './table/AllowanceTable';
import WalletHealthSection from './wallet-health/WalletHealthSection';

const AllowanceDashboard = () => {
  const { address, selectedChainId } = useAddressPageContext();
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
      <WalletHealthSection address={address} chainId={selectedChainId} />
      <AllowanceTableControls table={table} />
      <AllowanceTable table={table} loading={isLoading} error={error} allowances={allowances} />
    </div>
  );
};

export default AllowanceDashboard;
