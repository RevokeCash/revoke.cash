'use client';

import type { Delegation } from '@revoke.cash/core/delegations/DelegatePlatform';
import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import Card, { CardTitle } from 'components/common/Card';
import Table from 'components/common/table/Table';
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
    // @ts-expect-error - meta may have other properties from elsewhere in the code
    meta: {},
  });

  return (
    <Card
      header={<CardTitle title={t('address.delegations.eip7702_delegations')} />}
      className="p-0 overflow-x-scroll whitespace-nowrap scrollbar-hide"
    >
      <Table
        table={table}
        loading={isLoading}
        emptyChildren={t('address.delegations.no_eip7702_delegations')}
        error={error}
        className="border-none"
      />
    </Card>
  );
};

export default Eip7702DelegationsTable;
