import { flexRender, Table } from '@tanstack/react-table';
import TableBodyLoader from 'components/common/TableBodyLoader';
import type { AllowanceData } from 'lib/interfaces';
import { useLayoutEffect, useState } from 'react';

interface Props {
  isLoading?: boolean;
  table: Table<AllowanceData>;
}

const AllowanceTableBody = ({ isLoading, table }: Props) => {
  const ROW_HEIGHT = 52;
  const [loaderHeight, setLoaderHeight] = useState<number>(ROW_HEIGHT * 12);

  useLayoutEffect(() => {
    // 534 is around the size of the headers and controls (and at least 2 row also on small screens)
    // Note: This doesn't work very well on mobile any more because of the wallet health section being large
    setLoaderHeight(Math.max(window.innerHeight - 534, 2 * ROW_HEIGHT + 68));
  }, []);

  if (isLoading) {
    return (
      // Compensate for the different height of the address header on small screens
      <>
        <TableBodyLoader
          columns={7}
          rows={Math.floor(loaderHeight / ROW_HEIGHT)}
          className="allowances-loader max-sm:hidden"
        />
        <TableBodyLoader
          columns={7}
          rows={Math.floor((loaderHeight - 68) / ROW_HEIGHT)}
          className="allowances-loader sm:hidden"
        />
      </>
    );
  }

  return (
    <tbody>
      {table.getRowModel().rows.map((row) => (
        <tr key={row.id} className="border-t border-zinc-300 dark:border-zinc-500">
          {row.getVisibleCells().map((cell) => (
            <td key={cell.id} className="overflow-hidden px-2">
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
};

export default AllowanceTableBody;
