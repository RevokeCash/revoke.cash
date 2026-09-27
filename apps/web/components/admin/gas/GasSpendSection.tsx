'use client';

import type { GasSpendChain } from '@revoke.cash/core/admin/gas-spend';
import { AUTO_REVOKE_SUPPORTED_CHAINS } from '@revoke.cash/core/auto-revoke/config';
import { createColumnHelper } from '@tanstack/react-table';
import Card, { CardTitle } from 'components/common/Card';
import ChainDisplay from 'components/common/ChainDisplay';
import Table from 'components/common/table/Table';
import { formatUsd } from 'lib/admin/format';
import { useAdminGasSpend } from 'lib/hooks/admin/useAdminGas';
import { useTable } from 'lib/hooks/useTable';
import type { AppTableFeatures } from 'lib/utils/table';
import { useMemo } from 'react';
import { twMerge } from 'tailwind-merge';

// The total row is part of the table data, marked by a null chainId
interface SpendRow extends Omit<GasSpendChain, 'chainId'> {
  chainId: number | null;
}

interface Props {
  from: string;
  to: string;
}

const GasSpendSection = ({ from, to }: Props) => {
  const { data, isLoading, error } = useAdminGasSpend(from, to);

  const rows = useMemo((): SpendRow[] => {
    if (!data || data.chains.length === 0) return [];

    const totalRow: SpendRow = {
      chainId: null,
      actionCount: data.actionCount,
      spendUsd: data.spendUsd,
      failedActionCount: data.failedActionCount,
      failedSpendUsd: data.failedSpendUsd,
    };

    return [...data.chains, totalRow];
  }, [data]);

  const table = useTable({
    data: rows,
    columns,
    getRowId: (row) => (row.chainId === null ? 'total' : String(row.chainId)),
    // One row per chain plus the total row, so the total stays on the single page
    pageSize: AUTO_REVOKE_SUPPORTED_CHAINS.length + 1,
  });

  return (
    <Card
      header={
        <CardTitle
          title="Gas spend per chain"
          subtitle="Recorded cost of the transactions submitted in the period, at the price when they settled"
        />
      }
      className="p-0"
    >
      <Table
        table={table}
        loading={isLoading}
        error={error}
        emptyChildren="No gas spend in this period"
        className="border-none"
      />
    </Card>
  );
};

const isTotalRow = (row: SpendRow): boolean => row.chainId === null;

const columnHelper = createColumnHelper<AppTableFeatures, SpendRow>();

const columns = columnHelper.columns([
  columnHelper.accessor('chainId', {
    id: 'chain',
    header: 'Chain',
    cell: (info) => {
      const chainId = info.getValue();

      return (
        <div className={twMerge('py-1.5 pr-4 text-sm', chainId === null && 'font-medium')}>
          {chainId === null ? 'Total' : <ChainDisplay chainId={chainId} />}
        </div>
      );
    },
  }),
  columnHelper.accessor('actionCount', {
    id: 'transactions',
    header: () => <div className="text-right">Transactions</div>,
    cell: (info) => (
      <div className={twMerge('py-1.5 pr-4 text-right text-sm', isTotalRow(info.row.original) && 'font-medium')}>
        {info.getValue()}
      </div>
    ),
  }),
  columnHelper.accessor('spendUsd', {
    id: 'spend',
    header: () => <div className="text-right">Spend</div>,
    cell: (info) => (
      <div className={twMerge('py-1.5 pr-4 text-right text-sm', isTotalRow(info.row.original) && 'font-medium')}>
        {formatUsd(info.getValue())}
      </div>
    ),
  }),
  columnHelper.display({
    id: 'spendPerTransaction',
    header: () => <div className="text-right">Per transaction</div>,
    cell: (info) => (
      <div className={twMerge('py-1.5 pr-4 text-right text-sm', isTotalRow(info.row.original) && 'font-medium')}>
        {formatUsd(info.row.original.spendUsd / info.row.original.actionCount)}
      </div>
    ),
  }),
  columnHelper.accessor('failedSpendUsd', {
    id: 'failed',
    header: () => <div className="text-right">Failed</div>,
    cell: (info) => (
      <div className={twMerge('py-1.5 text-right text-sm', isTotalRow(info.row.original) && 'font-medium')}>
        {formatUsd(info.getValue())}{' '}
        <span className="text-xs text-zinc-500">({info.row.original.failedActionCount})</span>
      </div>
    ),
  }),
]);

export default GasSpendSection;
