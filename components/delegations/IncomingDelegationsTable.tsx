'use client';

import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { createColumnHelper } from '@tanstack/react-table';
import Error from 'components/common/Error';
import Loader from 'components/common/Loader';
import type { Delegation } from 'lib/delegate/DelegatePlatform';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import ContractCell from './cells/ContractCell';
import DelegationTypeCell from './cells/DelegationTypeCell';
import DelegatorCell from './cells/DelegatorCell';
import PlatformCell from './cells/PlatformCell';

interface Props {
  delegations: Delegation[];
  isLoading: boolean;
  error: Error | null;
}

const IncomingDelegationsTable = ({ delegations, isLoading, error }: Props) => {
  const t = useTranslations();
  const columnHelper = createColumnHelper<Delegation>();

  // Create TanStack table columns
  const tableColumns = useMemo(
    () => [
      columnHelper.accessor('type', {
        header: () => t('address.delegations.columns.type'),
        cell: (info) => <DelegationTypeCell delegation={info.row.original} />,
      }),
      columnHelper.accessor('delegator', {
        header: () => t('address.delegations.columns.delegator'),
        cell: (info) => <DelegatorCell delegation={info.row.original} />,
      }),
      columnHelper.accessor('contract', {
        header: () => t('address.delegations.columns.contract'),
        cell: (info) => <ContractCell delegation={info.row.original} />,
      }),
      columnHelper.accessor('platform', {
        header: () => t('address.delegations.columns.platform'),
        cell: (info) => <PlatformCell delegation={info.row.original} />,
      }),
    ],
    [t, columnHelper],
  );

  // Create TanStack table instance
  const table = useReactTable({
    data: delegations,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return <Loader isLoading={true} loadingMessage={t('address.delegations.loading')} />;
  }

  if (error) {
    return <Error error={error} />;
  }

  if (delegations.length === 0) {
    return (
      <div className="rounded-md border p-6 text-center">
        <h2 className="text-lg font-semibold">{t('address.delegations.no_incoming_delegations')}</h2>
        <p>{t('address.delegations.incoming_explanation')}</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-2 font-semibold text-lg">{t('address.delegations.incoming_delegations')}</h2>
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
            {table.getRowModel().rows.map((row) => (
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

export default IncomingDelegationsTable;
