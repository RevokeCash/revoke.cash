import { flexRender, Table } from '@tanstack/react-table';
import Error from 'components/common/Error';
import SpinLoader from 'components/common/SpinLoader';
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

  // if (loading) {
  //   return <SpinLoader size={40} center />;
  // }

  if (error) return <Error error={error} />;

  if (!allowances && !loading) return null;

  return (
    <div className="border border-black rounded-lg">
      <table className="w-full border-collapse">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-black h-10">
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="text-left px-2">
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        {!loading && (
          <>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-t border-gray-400">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="h-10 overflow-hidden px-2">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot>
              {table.getFooterGroups().map((footerGroup) => (
                <tr key={footerGroup.id}>
                  {footerGroup.headers.map((header) => (
                    <th key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.footer, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </tfoot>
          </>
        )}
      </table>
      {!loading && table.getRowModel().rows.length === 0 && (
        <div className="flex justify-center p-4 w-full">{t('dashboard:no_allowances')}</div>
      )}
      {loading && (
        <div className="flex justify-center p-2 w-full">
          <SpinLoader size={34} center />
        </div>
      )}
    </div>
  );
};

export default AllowanceTableBody;
