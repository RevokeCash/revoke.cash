'use client';

import { deriveFunnel, type PaymentFunnelPoint } from '@revoke.cash/core/admin/revenue';
import { createColumnHelper } from '@tanstack/react-table';
import Card, { CardTitle } from 'components/common/Card';
import Table from 'components/common/table/Table';
import { type DateRange, formatPeriodOrDays, getStartedPeriods, getToday, type Period } from 'lib/admin/date-range';
import { useAdminRevenueDataSince } from 'lib/hooks/admin/useAdminRevenue';
import { useTable } from 'lib/hooks/useTable';
import type { AppTableFeatures } from 'lib/utils/table';
import { useMemo } from 'react';
import { twMerge } from 'tailwind-merge';

const columnHelper = createColumnHelper<AppTableFeatures, PaymentFunnelPoint<Period>>();

const columns = columnHelper.columns([
  columnHelper.accessor((point) => formatPeriodOrDays(point.bucket), {
    id: 'month',
    header: 'Month',
    cell: (info) => <div className="py-1.5 pr-4 text-sm">{info.getValue()}</div>,
  }),
  columnHelper.accessor('pending', {
    id: 'pending',
    header: () => <div className="text-right">Pending</div>,
    cell: (info) => <div className="py-1.5 pr-4 text-right text-sm">{info.getValue()}</div>,
  }),
  columnHelper.accessor('confirmed', {
    id: 'confirmed',
    header: () => <div className="text-right">Confirmed</div>,
    cell: (info) => <div className="py-1.5 pr-4 text-right text-sm">{info.getValue()}</div>,
  }),
  columnHelper.accessor('expired', {
    id: 'expired',
    header: () => <div className="text-right">Expired</div>,
    cell: (info) => <div className="py-1.5 pr-4 text-right text-sm">{info.getValue()}</div>,
  }),
  columnHelper.accessor('failed', {
    id: 'failed',
    header: () => <div className="text-right">Failed</div>,
    cell: (info) => <div className="py-1.5 pr-4 text-right text-sm">{info.getValue()}</div>,
  }),
  columnHelper.accessor('reversed', {
    id: 'reversed',
    header: () => <div className="text-right">Reversed</div>,
    cell: (info) => (
      <div
        className={twMerge(
          'py-1.5 pr-4 text-right text-sm',
          info.getValue() > 0 && 'text-red-600 dark:text-red-400 font-medium',
        )}
      >
        {info.getValue()}
      </div>
    ),
  }),
  columnHelper.accessor('refunded', {
    id: 'refunded',
    header: () => <div className="text-right">Refunded</div>,
    cell: (info) => <div className="py-1.5 text-right text-sm">{info.getValue()}</div>,
  }),
]);

interface Props {
  range: DateRange;
}

const PaymentFunnelSection = ({ range }: Props) => {
  const { data, isLoading, isPlaceholderData } = useAdminRevenueDataSince(range.from);

  const newestFirst = useMemo(() => {
    if (!data) return [];
    const months = getStartedPeriods(range, 'month', getToday());
    return deriveFunnel(data, months).reverse();
  }, [data, range]);

  const table = useTable({
    data: newestFirst,
    columns,
    getRowId: (row) => row.bucket.from,
    pageSize: 12,
  });

  return (
    <Card
      header={
        <CardTitle
          title="Payment funnel"
          subtitle="Subscription payment quotes per UTC month in the selected period, by final status; reversed payments need attention"
        />
      }
      className="p-0"
    >
      <Table table={table} loading={isLoading} className={twMerge('border-none', isPlaceholderData && 'opacity-60')} />
    </Card>
  );
};

export default PaymentFunnelSection;
