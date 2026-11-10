import { flexRender, type ReactTable, type RowData } from '@tanstack/react-table';
import type { AppTableFeatures } from 'lib/utils/table';
import { twMerge } from 'tailwind-merge';

interface Props<TMeta extends object, T extends RowData> {
  table: ReactTable<AppTableFeatures<TMeta>, T>;
}

// Safari ignores position and z-index on thead and tfoot, so each cell moves with the window and has its own z-index.
// A collapsed table border does not move with the cells, so the line below each row is drawn on the cells.
// The before element overlaps the top and bottom of each cell, because rows show through there at fractional positions.
export const HEADER_CELL_CLASSES =
  'relative z-1 table-header-follows-window text-left px-2 first:pl-4 last:pr-4 whitespace-nowrap bg-white dark:bg-black before:absolute before:inset-x-0 before:-top-0.5 before:-bottom-px before:-z-1 before:bg-inherit after:absolute after:inset-x-0 after:-bottom-px after:h-px after:bg-zinc-200 dark:after:bg-zinc-800 forced-colors:after:bg-[CanvasText]!';

const TableHeader = <TMeta extends object, T extends RowData>({ table }: Props<TMeta, T>) => {
  const classes = {
    // z-2 keeps the line below the header above the cells of the footer row, which renders directly below the header
    cell: twMerge(HEADER_CELL_CLASSES, 'z-2'),
  };

  return (
    // The moved header must not be the scroll anchor, or rows jump when content above the table changes height
    <thead className="[overflow-anchor:none]">
      {table.getHeaderGroups().map((headerGroup) => (
        <tr key={headerGroup.id} className="border-b border-zinc-200 dark:border-zinc-800 h-10">
          {headerGroup.headers.map((header) => (
            <th key={header.id} className={classes.cell}>
              {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
            </th>
          ))}
        </tr>
      ))}
    </thead>
  );
};

export default TableHeader;
