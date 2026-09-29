'use client';

import type { GasSpendFailure } from '@revoke.cash/core/admin/gas-spend';
import { createColumnHelper } from '@tanstack/react-table';
import Card, { CardTitle } from 'components/common/Card';
import Table from 'components/common/table/Table';
import { formatPercentage, formatUsd } from 'lib/admin/format';
import { useAdminGasSpend } from 'lib/hooks/admin/useAdminGas';
import { useTable } from 'lib/hooks/useTable';
import type { AppTableFeatures } from 'lib/utils/table';
import { useMemo } from 'react';
import { twMerge } from 'tailwind-merge';

interface FailureRow extends GasSpendFailure {
  // Share of all recorded spend in the period
  spendShare: number;
}

interface Props {
  from: string;
  to: string;
}

const FailedTransactionsSection = ({ from, to }: Props) => {
  const { data, isLoading, isPlaceholderData, error } = useAdminGasSpend(from, to);

  const rows = useMemo(
    (): FailureRow[] =>
      (data?.failures ?? []).map((failure) => ({
        ...failure,
        spendShare: data && data.spendUsd > 0 ? failure.spendUsd / data.spendUsd : 0,
      })),
    [data],
  );

  const table = useTable({
    data: rows,
    columns,
    getRowId: (row) => row.errorCode ?? 'unknown',
    pageSize: 10,
  });

  return (
    <Card
      header={
        <CardTitle
          title="Failed transactions"
          subtitle="Failed transactions still pay for their gas, which counts against the subscription budgets"
        />
      }
      className="p-0"
    >
      <Table
        table={table}
        loading={isLoading}
        error={error}
        emptyChildren="No failed transactions in this period"
        className={twMerge('border-none', isPlaceholderData && 'opacity-60')}
      />
    </Card>
  );
};

const columnHelper = createColumnHelper<AppTableFeatures, FailureRow>();

const columns = columnHelper.columns([
  columnHelper.accessor('errorCode', {
    id: 'errorCode',
    header: 'Error code',
    cell: (info) => <div className="py-1.5 pr-4 font-mono text-sm">{info.getValue() ?? 'unknown'}</div>,
  }),
  columnHelper.accessor('actionCount', {
    id: 'transactions',
    header: () => <div className="text-right">Transactions</div>,
    cell: (info) => <div className="py-1.5 pr-4 text-right text-sm">{info.getValue()}</div>,
  }),
  columnHelper.accessor('spendUsd', {
    id: 'spend',
    header: () => <div className="text-right">Spend</div>,
    cell: (info) => <div className="py-1.5 pr-4 text-right text-sm">{formatUsd(info.getValue())}</div>,
  }),
  columnHelper.accessor('spendShare', {
    id: 'spendShare',
    header: () => <div className="text-right">Share of spend</div>,
    cell: (info) => <div className="py-1.5 text-right text-sm">{formatPercentage(info.getValue())}</div>,
  }),
]);

export default FailedTransactionsSection;
