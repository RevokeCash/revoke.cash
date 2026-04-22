import type { PermitTokenData } from '@revoke.cash/core/tokens';
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import Card, { CardTitle } from 'components/common/Card';
import Table from 'components/common/table/Table';
import { usePermitTokens } from 'lib/hooks/ethereum/usePermitTokens';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { ColumnId, columns } from './columns';

const PermitsTable = () => {
  const t = useTranslations();
  const { permitTokens, isLoading, error, onCancel } = usePermitTokens();

  const data = useMemo(() => permitTokens ?? [], [permitTokens]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel<PermitTokenData>(),
    getSortedRowModel: getSortedRowModel<PermitTokenData>(),
    getFilteredRowModel: getFilteredRowModel<PermitTokenData>(),
    getRowId(row) {
      return `${row.contract.address}`;
    },
    meta: { onCancel } as any,
    initialState: {
      columnVisibility: {
        [ColumnId.BALANCE]: false,
      },
    },
  });

  return (
    <Card
      header={<CardTitle title={t('signatures.permit.table.title')} />}
      className="p-0 overflow-x-scroll whitespace-nowrap scrollbar-hide"
    >
      <Table
        table={table}
        loading={isLoading}
        error={error}
        emptyChildren={t('signatures.permit.table.none_found')}
        loaderRows={6}
        className="border-none"
      />
    </Card>
  );
};

export default PermitsTable;
