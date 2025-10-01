import { flexRender, type Table } from '@tanstack/react-table';
import { isNullish } from 'lib/utils';

interface Props<T> {
  table: Table<T>;
}

const TableFooter = <T,>({ table }: Props<T>) => {
  const footers = table
    .getFooterGroups()
    .flatMap((group) => group.headers.map((header) => header.column.columnDef.footer))
    .filter((footer) => !isNullish(footer));

  if (footers.length === 0) return null;

  return (
    <tfoot className="table-row-group">
      {table.getFooterGroups().map((footerGroup) => (
        <tr key={footerGroup.id} className="border-b border-black dark:border-white h-10">
          {footerGroup.headers.map((header) => (
            <th key={header.id} className="text-left px-2 whitespace-nowrap">
              {header.isPlaceholder ? null : flexRender(header.column.columnDef.footer, header.getContext())}
            </th>
          ))}
        </tr>
      ))}
    </tfoot>
  );
};

export default TableFooter;
