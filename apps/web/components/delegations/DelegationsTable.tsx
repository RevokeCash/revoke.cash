'use client';

import type { Delegation } from '@revoke.cash/core/delegations/DelegatePlatform';
import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import Card, { CardTitle } from 'components/common/Card';
import Table from 'components/common/table/Table';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { columns } from './columns';

interface Props {
  delegations: Delegation[];
  isLoading: boolean;
  error: Error | null;
  onRevoke: (delegation: Delegation) => void;
}

const DelegationsTable = ({ delegations, isLoading, error, onRevoke }: Props) => {
  const t = useTranslations();

  const data = useMemo(() => delegations ?? [], [delegations]);

  const table = useReactTable<Delegation>({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta: { onRevoke } as any,
  });

  return (
    <Card
      header={<CardTitle title={t('address.navigation.delegations')} />}
      className="p-0 overflow-x-scroll whitespace-nowrap scrollbar-hide"
    >
      <Table
        table={table}
        loading={isLoading}
        emptyChildren={t('address.delegations.no_delegations')}
        loaderRows={2}
        error={error}
        className="border-none"
      />
    </Card>
  );
};

export default DelegationsTable;
