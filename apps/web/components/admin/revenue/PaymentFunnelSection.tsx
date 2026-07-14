'use client';

import { deriveFunnel, type PaymentFunnelPoint } from '@revoke.cash/core/admin/revenue';
import { createColumnHelper } from '@tanstack/react-table';
import Card, { CardTitle } from 'components/common/Card';
import Table from 'components/common/table/Table';
import { useAdminRevenueData } from 'lib/hooks/admin/useAdminRevenue';
import { useTable } from 'lib/hooks/useTable';
import { useMemo } from 'react';
import { twMerge } from 'tailwind-merge';

const columnHelper = createColumnHelper<PaymentFunnelPoint>();

const columns = [
  columnHelper.accessor('month', {
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
          'py-1.5 text-right text-sm',
          info.getValue() > 0 && 'text-red-600 dark:text-red-400 font-medium',
        )}
      >
        {info.getValue()}
      </div>
    ),
  }),
];

const PaymentFunnelSection = () => {
  const { data, isLoading } = useAdminRevenueData(12);

  const newestFirst = useMemo(() => (data ? [...deriveFunnel(data, 12)].reverse() : []), [data]);

  const table = useTable({
    data: newestFirst,
    columns,
    getRowId: (row) => row.month,
  });

  return (
    <Card
      header={
        <CardTitle
          title="Payment funnel"
          subtitle="Subscription payment quotes per UTC month by final status; reversed payments need attention"
        />
      }
      className="p-0"
    >
      <Table table={table} loading={isLoading} className="border-none" />
    </Card>
  );
};

export default PaymentFunnelSection;
