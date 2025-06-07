'use client';

import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import Card from 'components/common/Card';
import type Error from 'components/common/Error';
import Table from 'components/common/table/Table';
import type { Delegation } from 'lib/delegate/DelegatePlatform';
import { useTranslations } from 'next-intl';
import NoDelegationsFound from './NoDelegationsFound';
import { incomingColumns } from './columns';

interface Props {
  delegations: Delegation[];
  isLoading: boolean;
  error: Error | null;
}

const IncomingDelegationsTable = ({ delegations, isLoading, error }: Props) => {
  const t = useTranslations();
  // Use the hook to get translated columns
  const columns = incomingColumns;

  // Create TanStack table instance with empty meta
  const table = useReactTable<Delegation>({
    data: delegations || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    // @ts-ignore - meta may have other properties from elsewhere in the code
    meta: {},
  });

  // Get column count for spanning loading/error/empty states
  const columnCount = table.getAllLeafColumns().length;

  const title = (
    <div className="flex items-center gap-2">
      <div>{t('address.delegations.incoming_delegations')}</div>
    </div>
  );

  return (
    <Card title={title} className="p-0 overflow-x-scroll whitespace-nowrap scrollbar-hide">
      <Table
        table={table}
        loading={isLoading}
        emptyChildren={<NoDelegationsFound incoming={true} colSpan={columnCount} />}
        loaderRows={2}
        error={error}
      />
    </Card>
  );
};

export default IncomingDelegationsTable;
