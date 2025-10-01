'use client';

import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import Card from 'components/common/Card';
import Table from 'components/common/table/Table';
import type { Delegation } from 'lib/delegations/DelegatePlatform';
import { useTranslations } from 'next-intl';
import { outgoingColumns } from './columns';

interface Props {
  delegations: Delegation[];
  isLoading: boolean;
  error: Error | null;
  onRevoke: (delegation: Delegation) => void;
}

const OutgoingDelegationsTable = ({ delegations, isLoading, error, onRevoke }: Props) => {
  const t = useTranslations();

  // Create TanStack table instance
  const table = useReactTable<Delegation>({
    data: delegations || [],
    columns: outgoingColumns,
    getCoreRowModel: getCoreRowModel(),
    meta: { onRevoke } as any,
  });

  const title = (
    <div className="flex items-center gap-2">
      <div>{t('address.delegations.outgoing_delegations')}</div>
    </div>
  );
  return (
    <Card title={title} className="p-0 overflow-x-scroll whitespace-nowrap scrollbar-hide">
      <Table
        table={table}
        loading={isLoading}
        emptyChildren={t('address.delegations.no_outgoing_delegations')}
        loaderRows={2}
        error={error}
        className="border-none"
      />
    </Card>
  );
};

export default OutgoingDelegationsTable;
