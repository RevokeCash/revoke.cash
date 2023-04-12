import { flexRender, Table } from '@tanstack/react-table';
import type { AllowanceData } from 'lib/interfaces';

interface Props {
  table: Table<AllowanceData>;
}

const AllowanceTableBody = ({ table }: Props) => {
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
