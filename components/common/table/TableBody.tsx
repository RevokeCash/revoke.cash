import { flexRender, Table } from '@tanstack/react-table';
import { ColumnId } from 'components/allowances/dashboard/columns';
import TableBodyLoader from 'components/common/TableBodyLoader';
import { twMerge } from 'tailwind-merge';

interface Props<T> {
  isLoading?: boolean;
  table: Table<T>;
  loaderRows?: number;
}

const TableBody = <T,>({ table, isLoading, loaderRows }: Props<T>) => {
  if (isLoading) {
    return (
      <TableBodyLoader
        columns={table.getVisibleFlatColumns()}
        rowCount={loaderRows ?? 10}
        className="allowances-loader"
      />
    );
  }

  return (
    <tbody>
      {table.getRowModel().rows.map((row) => (
        <tr key={row.id} className="border-t border-zinc-300 dark:border-zinc-500">
          {row.getVisibleCells().map((cell) => (
            <td key={cell.id} className={twMerge('overflow-hidden px-2', cell.column.id === ColumnId.SELECT && 'w-0')}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
};

export default TableBody;
