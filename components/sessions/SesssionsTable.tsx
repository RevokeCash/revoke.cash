import { ChainId } from '@revoke.cash/chains';
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import Card from 'components/common/Card';
import ChainDisplay from 'components/common/ChainDisplay';
import Table from 'components/common/table/Table';
import { useSessions } from 'lib/hooks/ethereum/sessions/useSessions';
import { useAddress } from 'lib/hooks/page-context/AddressIdentityContext';
import { AddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import { isNullish } from 'lib/utils';
import type { Session } from 'lib/utils/sessions';
import { useTranslations } from 'next-intl';
import { useContext, useMemo } from 'react';
import { columns } from './columns';

interface Props {
  chainId?: number;
}

const SessionsTable = ({ chainId }: Props) => {
  const t = useTranslations();
  const { address } = useAddress();
  const context = useContext(AddressPageContext);
  const selectedChainId = chainId ?? context?.selectedChainId;
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
    meta: { onSessionRevoke } as any,
  });

  if (selectedChainId !== ChainId.Abstract) {
    return null;
  }

  const title = (
    <div className="flex items-center gap-2">
      {isNullish(chainId) ? t('address.sessions.table.title') : <ChainDisplay chainId={chainId} logoSize={28} />}
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
