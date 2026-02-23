'use client';

import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import Card from 'components/common/Card';
import Table from 'components/common/table/Table';
import type { Delegation } from 'lib/delegations/DelegatePlatform';
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

  const title = (
    <div className="flex items-center gap-2">
      <div>{t('address.navigation.delegations')}</div>
    </div>
  );

  return (
    <Card title={title} className="p-0 overflow-x-scroll whitespace-nowrap scrollbar-hide">
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
