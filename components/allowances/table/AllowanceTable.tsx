import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import { ColumnId, columns } from 'components/allowances/table/columns';
import { useAddressAllowances } from 'lib/hooks/page-context/AddressPageContext';
import type { AllowanceData } from 'lib/interfaces';
import { useEffect, useState } from 'react';
import AllowanceTableBody from './AllowanceTableBody';
import AllowanceTableHeader from './header/AllowanceTableHeader';

const AllowanceTable = () => {
  const { allowances, isLoading, error, onUpdate } = useAddressAllowances();
  const [contractFilter, setContractFilter] = useState(null);
  const [filteredAllowances, setFilteredAllowances] = useState([]);

  useEffect(() => {
    if (allowances && allowances.length > 0) {
      if (contractFilter !== null) {
        setFilteredAllowances(
          allowances.filter((item) => item.spender && item.spender.toLowerCase() === contractFilter.toLowerCase())
        );
      }
      // Reset to full alllowances on clear
      if (contractFilter === null && filteredAllowances.length !== allowances.length) {
        setFilteredAllowances(allowances);
      }
    }
  }, [contractFilter]);

  useEffect(() => {
    // Initial set necessary, giving allowances as default state to filteredAllowances
    // directly in the hook does not work with useReactTable()
    if (allowances && allowances.length > 0 && filteredAllowances.length === 0) {
      setFilteredAllowances(allowances);
    }
  }, [allowances]);

  const table = useReactTable({
    data: filteredAllowances,
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
      <AllowanceTableHeader table={table} filterByContract={setContractFilter} />
      <AllowanceTableBody table={table} loading={isLoading} error={error} allowances={allowances} />
    </div>
  );
};

export default AllowanceTable;
