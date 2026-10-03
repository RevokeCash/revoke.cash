import { flexRender, type ReactTable, type Row, type RowData } from '@tanstack/react-table';
import { ColumnId } from 'components/allowances/dashboard/columns';
import TableBodyLoader from 'components/common/TableBodyLoader';
import type { AppTableFeatures } from 'lib/utils/table';
import { Fragment } from 'react';
import { twMerge } from 'tailwind-merge';

interface Props<TMeta extends object, T extends RowData> {
  isLoading?: boolean;
  table: ReactTable<AppTableFeatures<TMeta>, T>;
  partialLoadingRows?: number;
  // Number of placeholder rows while loading; defaults to the page size
  loadingRows?: number;
  // Renders a full-width sub-row (e.g. an expanded details <tr>) below rows that are expanded
  renderSubComponent?: (row: Row<AppTableFeatures<TMeta>, T>) => React.ReactNode;
  // Makes expandable rows toggle their expansion when clicked anywhere outside an interactive element
  expandOnRowClick?: boolean;
}

const TableBody = <TMeta extends object, T extends RowData>({
  table,
  isLoading,
  partialLoadingRows = 0,
  loadingRows,
  renderSubComponent,
  expandOnRowClick,
}: Props<TMeta, T>) => {
  const rows = table.getRowModel().rows;
  const hasRows = rows.length > 0;

  if (isLoading && !hasRows) {
    return (
      <TableBodyLoader
        columns={table.getVisibleFlatColumns()}
        rowCount={loadingRows ?? table.state.pagination.pageSize}
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
          <Fragment key={row.id}>
            <TableBodyRow row={row} expandOnRowClick={expandOnRowClick} />
            {row.getIsExpanded() && renderSubComponent?.(row)}
          </Fragment>
        ))}
      </tbody>
    </>
  );
};

export default TableBody;

interface RowProps<TMeta extends object, T extends RowData> {
  row: Row<AppTableFeatures<TMeta>, T>;
  expandOnRowClick?: boolean;
}

const TableBodyRow = <TMeta extends object, T extends RowData>({ row, expandOnRowClick }: RowProps<TMeta, T>) => {
  const togglesExpansionOnClick = Boolean(expandOnRowClick && row.getCanExpand());

  const toggleExpandedUnlessInteractive = (event: React.MouseEvent<HTMLTableRowElement>) => {
    // Clicks on interactive elements inside cells (links, buttons, inputs) should not toggle the row
    const clickedInteractiveElement = (event.target as HTMLElement).closest('a, button, input, select, textarea');
    if (clickedInteractiveElement) return;
    row.toggleExpanded();
  };

  return (
    <tr
      key={row.id}
      className={twMerge('border-t border-zinc-200 dark:border-zinc-800', togglesExpansionOnClick && 'cursor-pointer')}
      onClick={togglesExpansionOnClick ? toggleExpandedUnlessInteractive : undefined}
    >
      {row.getVisibleCells().map((cell) => (
        <td
          key={cell.id}
          className={twMerge('overflow-hidden px-2 first:pl-4 last:pr-4', cell.column.id === ColumnId.SELECT && 'w-0')}
        >
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </td>
      ))}
    </tr>
  );
};
