import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import Error from 'components/common/Error';
import SpinLoader from 'components/common/SpinLoader';
import { ColumnId, columns } from 'components/Dashboard/table/columns';
import { useAllowances } from 'lib/hooks/useAllowances';
import { useAppContext } from 'lib/hooks/useAppContext';
import type { AllowanceData } from 'lib/interfaces';
import useTranslation from 'next-translate/useTranslation';
import FilterSelect from './FilterSelect';
import SortSelect from './SortSelect';

const AllowanceTable = () => {
  const { t } = useTranslation();
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

  if (loading) {
    return <SpinLoader size={40} center />;
  }

  if (error) return <Error error={error} />;

  if (!allowances) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-start gap-2">
        <SortSelect table={table} />
        <FilterSelect table={table} />
      </div>
      <div className="border border-black rounded-md">
        <table className="w-full border-collapse">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-black h-10">
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="text-left px-2">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-t border-gray-400">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="h-10 overflow-hidden px-2">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            {table.getFooterGroups().map((footerGroup) => (
              <tr key={footerGroup.id}>
                {footerGroup.headers.map((header) => (
                  <th key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.footer, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </tfoot>
        </table>
        {table.getRowModel().rows.length === 0 && (
          <div className="flex justify-center p-4 w-full">{t('dashboard:no_allowances')}</div>
        )}
      </div>
    </div>
  );
};

export default AllowanceTable;
