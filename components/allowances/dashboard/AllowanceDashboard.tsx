import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import { ColumnId, columns } from 'components/allowances/dashboard/columns';
import Table from 'components/common/table/Table';
import { useAddressAllowances, useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import type { AllowanceData } from 'lib/interfaces';
import NoAllowancesFound from './NoAllowancesFound';
import AllowanceTableControls from './controls/AllowanceTableControls';
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
    // TODO: Because of declaration merging in @tanstack/table-core we can't have multiple custom fields and need to type as any
    // See https://github.com/TanStack/table/discussions/4220
    meta: { onUpdate } as any,
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
      <Table
        table={table}
        loading={isLoading}
        error={error}
        emptyChildren={<NoAllowancesFound allowances={allowances} />}
      />
    </div>
  );
};

export default AllowanceDashboard;
