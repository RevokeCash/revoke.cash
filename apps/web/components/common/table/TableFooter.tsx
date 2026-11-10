import { isNullish } from '@revoke.cash/core/utils';
import { flexRender, type ReactTable, type RowData } from '@tanstack/react-table';
import type { AppTableFeatures } from 'lib/utils/table';
import { HEADER_CELL_CLASSES } from './TableHeader';

interface Props<TMeta extends object, T extends RowData> {
  table: ReactTable<AppTableFeatures<TMeta>, T>;
}

const TableFooter = <TMeta extends object, T extends RowData>({ table }: Props<TMeta, T>) => {
  const footers = table
    .getFooterGroups()
    .flatMap((group) => group.headers.map((header) => header.column.columnDef.footer))
    .filter((footer) => !isNullish(footer));

  if (footers.length === 0) return null;

  return (
    // Renders directly below the header and follows the window with it, see TableHeader
    <tfoot className="table-row-group [overflow-anchor:none]">
      {table.getFooterGroups().map((footerGroup) => (
        <tr key={footerGroup.id} className="border-b border-zinc-200 dark:border-zinc-800 h-10">
          {footerGroup.headers.map((header) => (
            <th key={header.id} className={HEADER_CELL_CLASSES}>
              {header.isPlaceholder ? null : flexRender(header.column.columnDef.footer, header.getContext())}
            </th>
          ))}
        </tr>
      ))}
    </tfoot>
  );
};

export default TableFooter;
