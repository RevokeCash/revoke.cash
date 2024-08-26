import { Column } from '@tanstack/table-core';
import { ColumnId } from 'components/allowances/dashboard/columns';
import Loader from './Loader';

interface Props extends React.HTMLAttributes<HTMLTableSectionElement> {
  columns: Column<any>[];
  rowCount: number;
}

const TableBodyLoader = ({ columns, rowCount, ...props }: Props) => {
  const selectionColumn = columns.findIndex((column) => column.id === ColumnId.SELECT);
  const adjustedColumnCount = columns.length - (selectionColumn !== -1 ? 1 : 0);

  return (
    <tbody {...props}>
      {[...Array(rowCount)].map((_, i) => (
        <tr key={i} className="border-t first:border-0 border-zinc-300 dark:border-zinc-500">
          {[...Array(adjustedColumnCount)].map((column, j) => (
            <td key={j} colSpan={j === selectionColumn ? 2 : 1}>
              <div className="py-2.75 px-2">
                <Loader isLoading>
                  <div className="h-7" />
                </Loader>
              </div>
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
};

export default TableBodyLoader;
