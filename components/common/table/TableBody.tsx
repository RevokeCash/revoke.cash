import { flexRender, type Row, type Table } from '@tanstack/react-table';
import { ColumnId } from 'components/allowances/dashboard/columns';
import TableBodyLoader from 'components/common/TableBodyLoader';
import { twMerge } from 'tailwind-merge';

interface Props<T> {
  isLoading?: boolean;
  table: Table<T>;
  loaderRows?: number;
  partialLoadingRows?: number;
}

const TableBody = <T,>({ table, isLoading, loaderRows, partialLoadingRows = 0 }: Props<T>) => {
  const rows = table.getRowModel().rows;
  const hasRows = rows.length > 0;

  if (isLoading && !hasRows) {
    return (
      <TableBodyLoader
        columns={table.getVisibleFlatColumns()}
        rowCount={loaderRows ?? 10}
        className="allowances-loader"
      />
    );
  }

  return (
    <>
      {isLoading && hasRows && partialLoadingRows > 0 ? (
        <TableBodyLoader
          columns={table.getVisibleFlatColumns()}
          rowCount={partialLoadingRows}
          className="allowances-loader"
        />
      ) : null}
      <tbody>
        {rows.map((row) => (
          <TableBodyRow key={row.id} row={row} />
        ))}
      </tbody>
    </>
  );
};

export default TableBody;

const TableBodyRow = <T,>({ row }: { row: Row<T> }) => {
  return (
    <tr key={row.id} className="border-t border-zinc-300 dark:border-zinc-500">
      {row.getVisibleCells().map((cell) => (
        <td key={cell.id} className={twMerge('overflow-hidden px-2', cell.column.id === ColumnId.SELECT && 'w-0')}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </td>
      ))}
    </tr>
  );
};
