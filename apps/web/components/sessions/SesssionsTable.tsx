import { ChainId } from '@revoke.cash/chains';
import { isNullish } from '@revoke.cash/core/utils';
import Card, { CardTitle } from 'components/common/Card';
import ChainDisplay from 'components/common/ChainDisplay';
import Table from 'components/common/table/Table';
import { useSessions } from 'lib/hooks/ethereum/sessions/useSessions';
import { useAddress } from 'lib/hooks/page-context/AddressIdentityContext';
import { AddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import { useTable } from 'lib/hooks/useTable';
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

  const table = useTable({
    data,
    columns,
    getRowId: (row) => `${row.payload.sessionHash}`,
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
        className="border-none"
      />
    </Card>
  );
};

export default SessionsTable;
