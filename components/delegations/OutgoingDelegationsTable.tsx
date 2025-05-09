'use client';

import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
// biome-ignore lint/suspicious/noShadowRestrictedNames: <explanation>
import Error from 'components/common/Error';
import Loader from 'components/common/Loader';
import type { Delegation } from 'lib/delegate/DelegatePlatform';
import { useTranslations } from 'next-intl';
import NoDelegationsFound from './NoDelegationsFound';
import { useColumns } from './columns';

interface Props {
  delegations: Delegation[];
  isLoading: boolean;
  error: Error | null;
  onRevoke: (delegation: Delegation) => void;
}

const OutgoingDelegationsTable = ({ delegations, isLoading, error, onRevoke }: Props) => {
  const t = useTranslations();
  const columns = useColumns({ onRevoke });

  // Create TanStack table instance
  const table = useReactTable({
    data: delegations || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // Get column count for spanning loading/error/empty states
  const columnCount = table.getAllLeafColumns().length;

  return (
    <div>
      <h2 className="mb-2 font-semibold text-lg">{t('address.delegations.outgoing_delegations')}</h2>
      <div className="border border-black dark:border-white rounded-lg overflow-x-scroll whitespace-nowrap scrollbar-hide">
        <table className="w-full border-collapse">
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
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={columnCount} className="py-4 text-center">
                  <Loader isLoading={true} loadingMessage={t('address.delegations.loading')} />
                </td>
              </tr>
            )}

            {error && (
              <tr>
                <td colSpan={columnCount} className="py-4">
                  <Error error={error} />
                </td>
              </tr>
            )}

            {!isLoading && !error && delegations.length === 0 && (
              <NoDelegationsFound incoming={false} colSpan={columnCount} />
            )}

            {!isLoading &&
              !error &&
              delegations.length > 0 &&
              table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-2 py-2">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OutgoingDelegationsTable;
