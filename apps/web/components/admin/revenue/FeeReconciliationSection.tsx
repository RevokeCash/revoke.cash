'use client';

import type { FeePaymentPath, FeeReconciliationRow } from '@revoke.cash/core/admin/fee-reconciliation';
import { BATCH_REVOKE_FEE_USD_CENTS } from '@revoke.cash/core/constants';
import { formatUsdCents } from '@revoke.cash/core/utils/formatting';
import { createColumnHelper } from '@tanstack/react-table';
import Button from 'components/common/Button';
import Card, { CardHeader } from 'components/common/Card';
import ChainDisplay from 'components/common/ChainDisplay';
import Table from 'components/common/table/Table';
import type { DateRange } from 'lib/admin/date-range';
import { useAdminFeeReconciliation } from 'lib/hooks/admin/useAdminRevenue';
import { useTable } from 'lib/hooks/useTable';
import type { AppTableFeatures } from 'lib/utils/table';
import { useMemo } from 'react';
import { twMerge } from 'tailwind-merge';

const PATH_LABELS: Record<FeePaymentPath, string> = {
  plain: 'Plain transfer',
  batched: 'Batched call',
};

interface Props {
  range: DateRange;
}

const FeeReconciliationSection = ({ range }: Props) => {
  const { data, isFetching, error, refetch } = useAdminFeeReconciliation(range.from, range.to);

  const rows = useMemo(() => data ?? [], [data]);

  const table = useTable({ data: rows, columns, getRowId: (row) => `${row.chainId}-${row.path}` });

  return (
    <Card
      header={
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-xl">Fee payments missing from revenue</h2>
              <p>
                Batch revoke fees received by fees.revoke.eth on chain in the selected period, compared with batch
                revokes whose fee check passed (only those count as revenue and VAT)
              </p>
            </div>
            <Button style="secondary" size="sm" onClick={() => refetch()} loading={isFetching}>
              {data ? 'Check again' : 'Check payments'}
            </Button>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Missing means no batch revoke row, or a fee check that is pending or failed. Payments count from 2026-07-16,
            because fees went to revoke.eth before that. Values assume the fixed{' '}
            {formatUsdCents(BATCH_REVOKE_FEE_USD_CENTS)} fee.
          </p>
        </CardHeader>
      }
      className="p-0"
    >
      <Table
        table={table}
        loading={isFetching && !data}
        error={error}
        emptyChildren={
          data
            ? 'No fee payments to check in the selected period'
            : 'Not checked yet. The check reads every payment to fees.revoke.eth from the explorer and can take up to a minute.'
        }
        className={twMerge('border-none', isFetching && 'opacity-60')}
      />
    </Card>
  );
};

const columnHelper = createColumnHelper<AppTableFeatures, FeeReconciliationRow>();

const columns = columnHelper.columns([
  columnHelper.accessor('chainId', {
    id: 'chain',
    header: 'Chain',
    cell: (info) => (
      <div className="py-1.5 pr-4 text-sm">
        <ChainDisplay chainId={info.getValue()} />
      </div>
    ),
  }),
  columnHelper.accessor('path', {
    id: 'path',
    header: 'Payment',
    cell: (info) => <div className="py-1.5 pr-4 text-sm">{PATH_LABELS[info.getValue()]}</div>,
  }),
  columnHelper.accessor('receivedCount', {
    id: 'received',
    header: () => <div className="text-right">Received</div>,
    cell: (info) => <div className="py-1.5 pr-4 text-right text-sm">{info.getValue().toLocaleString()}</div>,
  }),
  columnHelper.accessor('inRevenueCount', {
    id: 'inRevenue',
    header: () => <div className="text-right">In revenue</div>,
    cell: (info) => <div className="py-1.5 pr-4 text-right text-sm">{info.getValue().toLocaleString()}</div>,
  }),
  columnHelper.accessor('missingCount', {
    id: 'missing',
    header: () => <div className="text-right">Missing</div>,
    cell: (info) => <div className="py-1.5 pr-4 text-right text-sm">{info.getValue().toLocaleString()}</div>,
  }),
  columnHelper.display({
    id: 'missingShare',
    header: () => <div className="text-right">Missing %</div>,
    cell: (info) => {
      const { missingCount, receivedCount } = info.row.original;

      return (
        <div className="py-1.5 pr-4 text-right text-sm">
          {receivedCount > 0 ? (
            `${((missingCount / receivedCount) * 100).toFixed(1)}%`
          ) : (
            <span className="text-zinc-500">-</span>
          )}
        </div>
      );
    },
  }),
  columnHelper.accessor('missingUsdCents', {
    id: 'missingValue',
    header: () => <div className="text-right">Missing value</div>,
    cell: (info) => <div className="py-1.5 text-right text-sm">{formatUsdCents(info.getValue())}</div>,
  }),
]);

export default FeeReconciliationSection;
