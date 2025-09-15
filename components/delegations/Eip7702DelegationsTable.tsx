'use client';

import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import Card from 'components/common/Card';
import Table from 'components/common/table/Table';
import type { Delegation } from 'lib/delegations/DelegatePlatform';
import { useTranslations } from 'next-intl';
import { eip7702Columns } from './columns';

interface Props {
  delegations: Delegation[];
  isLoading: boolean;
  error: Error | null;
}

const Eip7702DelegationsTable = ({ delegations, isLoading, error }: Props) => {
  const t = useTranslations();

  // Create TanStack table instance with empty meta
  const table = useReactTable<Delegation>({
    data: delegations || [],
    columns: eip7702Columns,
    getCoreRowModel: getCoreRowModel(),
    // @ts-ignore - meta may have other properties from elsewhere in the code
    meta: {},
  });

  const title = (
    <div className="flex items-center gap-2">
      <div>{t('address.delegations.eip7702_delegations')}</div>
    </div>
  );

  return (
    <Card title={title} className="p-0 overflow-x-scroll whitespace-nowrap scrollbar-hide">
      <Table
        table={table}
        loading={isLoading}
        emptyChildren={t('address.delegations.no_eip7702_delegations')}
        loaderRows={2}
        error={error}
        className="border-none"
      />
    </Card>
  );
};

export default Eip7702DelegationsTable;
