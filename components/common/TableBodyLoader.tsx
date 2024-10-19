import { Column } from '@tanstack/table-core';
import { ColumnId } from 'components/allowances/dashboard/columns';
import { twMerge } from 'tailwind-merge';
import Loader from './Loader';

interface Props extends React.HTMLAttributes<HTMLTableSectionElement> {
  columns: Column<any>[];
  rowCount: number;
}

const TableBodyLoader = ({ columns, rowCount, ...props }: Props) => {
  return (
    <tbody {...props}>
      {[...Array(rowCount)].map((_, i) => (
        <tr key={i} className="border-t first:border-0 border-zinc-300 dark:border-zinc-500">
          {columns.map((column, j) => (
            <td key={j} className={twMerge(column.id === ColumnId.SELECT && 'w-0')}>
              {column.id === ColumnId.SELECT ? null : (
                <div className="py-2.75 px-2">
                  <Loader isLoading>
                    <div className="h-7" />
                  </Loader>
                </div>
              )}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
};

export default TableBodyLoader;
