import { flexRender, Table } from '@tanstack/react-table';
import Error from 'components/common/Error';
import Spinner from 'components/common/Spinner';
import type { AllowanceData } from 'lib/interfaces';
import useTranslation from 'next-translate/useTranslation';

interface Props {
  loading: boolean;
  table: Table<AllowanceData>;
  error?: Error;
  allowances?: AllowanceData[];
}

const AllowanceTableBody = ({ loading, error, table, allowances }: Props) => {
  const { t } = useTranslation();

  if (!allowances && !loading && !error) return null;

  return (
    <div className="border border-black dark:border-white rounded-lg overflow-x-scroll whitespace-nowrap scrollbar-hide">
      <table className="w-full border-collapse allowances-table">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-black dark:border-white h-10">
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="text-left px-2 whitespace-nowrap">
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        {!loading && !error && (
          <>
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
          </>
        )}
      </table>
      {!loading && !error && table.getRowModel().rows.length === 0 && (
        <div className="flex justify-center items-center h-12 w-full">{t('address:no_allowances')}</div>
      )}
      {loading && (
        <div className="flex justify-center items-center h-12 w-full">
          <Spinner className="w-6 h-6 allowances-loader" />
        </div>
      )}
      {error && (
        <div className="flex justify-center items-center h-12 w-full">
          <Error error={error} />
        </div>
      )}
    </div>
  );
};

export default AllowanceTableBody;
