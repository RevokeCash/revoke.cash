import { ChainId } from '@revoke.cash/chains';
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import Card from 'components/common/Card';
import Table from 'components/common/table/Table';
import { useSessions } from 'lib/hooks/ethereum/sessions/useSessions';
import { useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import type { Session } from 'lib/utils/sessions';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { columns } from './columns';

const SessionsTable = () => {
  const t = useTranslations();
  const { selectedChainId, address } = useAddressPageContext();
  const { sessions, isLoading, error, onSessionRevoke } = useSessions(address, selectedChainId);

  const data = useMemo(() => sessions ?? [], [sessions]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel<Session>(),
    getSortedRowModel: getSortedRowModel<Session>(),
    getFilteredRowModel: getFilteredRowModel<Session>(),
    getRowId(row) {
      return `${row.payload.sessionHash}`;
    },

    // biome-ignore lint/suspicious/noExplicitAny: Because of declaration merging in @tanstack/table-core we can't have multiple custom fields and need to type as any. See https://github.com/TanStack/table/discussions/4220
    meta: { onSessionRevoke } as any,
  });

  if (selectedChainId !== ChainId.Abstract) {
    return null;
  }

  const title = (
    <div className="flex items-center gap-2">
      <div>{t('address.sessions.table.title')}</div>
    </div>
  );

  return (
    <Card title={title} className="p-0 overflow-x-scroll whitespace-nowrap scrollbar-hide">
      <Table
        table={table}
        loading={isLoading}
        error={error}
        emptyChildren={t('address.sessions.table.none_found')}
        loaderRows={2}
        className="border-none"
      />
    </Card>
  );
};

export default SessionsTable;
