import { ChainId } from '@revoke.cash/chains';
import type { Session } from '@revoke.cash/core/sessions';
import { isNullish } from '@revoke.cash/core/utils';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import Card, { CardTitle } from 'components/common/Card';
import ChainDisplay from 'components/common/ChainDisplay';
import Table from 'components/common/table/Table';
import { useSessions } from 'lib/hooks/ethereum/sessions/useSessions';
import { useAddress } from 'lib/hooks/page-context/AddressIdentityContext';
import { AddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
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
    getPaginationRowModel: getPaginationRowModel<Session>(),
    initialState: {
      pagination: {
        pageSize: 25,
      },
    },
    getRowId(row) {
      return `${row.payload.sessionHash}`;
    },
    meta: { onSessionRevoke } as any,
  });

  if (selectedChainId !== ChainId.Abstract) {
    return null;
  }

  const header = (
    <CardTitle
      title={isNullish(chainId) ? t('address.sessions.table.title') : <ChainDisplay chainId={chainId} logoSize={28} />}
    />
  );

  return (
    <Card header={header} className="p-0">
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
