'use client';

import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import { ColumnId, columns } from 'components/allowances/dashboard/columns';
import Table from 'components/common/table/Table';
import { useAddressAllowances } from 'lib/hooks/page-context/AddressPageContext';
import { isNullish } from 'lib/utils';
import type { Erc721SingleAllowance, TokenAllowanceData } from 'lib/utils/allowances';
import { useEffect, useMemo, useState } from 'react';
import AllowanceTableControls from './controls/AllowanceTableControls';
import NoAllowancesFound from './NoAllowancesFound';

const getRowId = (row: TokenAllowanceData) => {
  return `${row.chainId}-${row.contract.address}-${row.payload?.spender}-${(row.payload as Erc721SingleAllowance)?.tokenId}`;
};

const AllowanceDashboard = () => {
  const { allowances, isLoading, error, onUpdate } = useAddressAllowances();

  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  // We fall back to an empty array because the table crashes if the data is undefined
  // and we use useMemo to prevent the table from infinite re-rendering
  const data = useMemo(() => {
    return allowances ?? [];
  }, [allowances]);

  // When rows are deleted, the row selection state is not updated automatically (see https://github.com/TanStack/table/issues/4369)
  // This effect manually syncs the row selection state with the new table data
  useEffect(() => {
    setRowSelection((currentSelection: Record<string, boolean>) => {
      if (!data || data.length === 0) return {};
      if (Object.keys(currentSelection).length === 0) return {};

      return data.reduce<Record<string, boolean>>((acc, allowance) => {
        if (currentSelection[getRowId(allowance)]) acc[getRowId(allowance)] = true;
        return acc;
      }, {});
    });
  }, [data]);

  const table = useReactTable({
    data,
    columns,
    state: {
      rowSelection,
    },
    debugTable: true,
    enableRowSelection: (row) => !isNullish(row.original.payload) && isNullish(row.original.payload?.revokeError),
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel<TokenAllowanceData>(),
    getSortedRowModel: getSortedRowModel<TokenAllowanceData>(),
    getFilteredRowModel: getFilteredRowModel<TokenAllowanceData>(),
    getRowId,
    meta: { onUpdate } as any,
    initialState: {
      sorting: [{ id: ColumnId.LAST_UPDATED, desc: true }],
      columnVisibility: {
        [ColumnId.BALANCE]: false,
      },
    },
  });

  return (
    <div className="flex flex-col justify-start mx-auto gap-2">
      <AllowanceTableControls table={table} />
      <Table
        table={table}
        loading={isLoading}
        error={error}
        emptyChildren={<NoAllowancesFound allowances={allowances!} />}
      />
    </div>
  );
};

export default AllowanceDashboard;
