'use client';

import { type ChainRevenue, deriveByChain, deriveByPlan, type PlanRevenue } from '@revoke.cash/core/admin/revenue';
import { getChainName } from '@revoke.cash/core/chains';
import { formatUsdCents } from '@revoke.cash/core/utils/formatting';
import { createColumnHelper } from '@tanstack/react-table';
import Card, { CardHeader } from 'components/common/Card';
import ChainLogo from 'components/common/ChainLogo';
import EmptyState from 'components/common/EmptyState';
import Table from 'components/common/table/Table';
import { useAdminRevenueData } from 'lib/hooks/admin/useAdminRevenue';
import { useTable } from 'lib/hooks/useTable';
import { useState } from 'react';
import { twMerge } from 'tailwind-merge';
import DateRangeInputs, { currentUtcDate, currentUtcYearStart } from './DateRangeInputs';

const RevenueBreakdownSection = () => {
  const [fromDate, setFromDate] = useState(currentUtcYearStart);
  const [toDate, setToDate] = useState(currentUtcDate);
  const { data, isLoading } = useAdminRevenueData(12);

  const fromIso = `${fromDate}T00:00:00.000Z`;
  const toExclusiveIso = `${toDate}T23:59:59.999Z`;

  return (
    <Card
      header={
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-xl">Revenue breakdown</h2>
              <p>Confirmed revenue by chain and plan for the selected period</p>
            </div>
            <DateRangeInputs from={fromDate} to={toDate} onFromChange={setFromDate} onToChange={setToDate} />
          </div>
        </CardHeader>
      }
      isLoading={isLoading}
      className={twMerge(isLoading && 'h-80')}
    >
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RevenueByChainTable byChain={deriveByChain(data, fromIso, toExclusiveIso)} />
          <RevenueByPlanTable byPlan={deriveByPlan(data, fromIso, toExclusiveIso)} />
        </div>
      )}
    </Card>
  );
};

const chainColumnHelper = createColumnHelper<ChainRevenue>();

const chainColumns = [
  chainColumnHelper.accessor('chainId', {
    id: 'chain',
    header: 'Chain',
    cell: (info) => (
      <div className="flex items-center gap-2 py-1.5 pr-4 text-sm">
        <ChainLogo chainId={info.getValue()} size={20} />
        {getChainName(info.getValue())}
      </div>
    ),
  }),
  chainColumnHelper.accessor('subscriptionsUsdCents', {
    id: 'subscriptions',
    header: () => <div className="text-right">Subscriptions</div>,
    cell: (info) => <div className="py-1.5 pr-4 text-right text-sm">{formatUsdCents(info.getValue())}</div>,
  }),
  chainColumnHelper.accessor('batchRevokesUsdCents', {
    id: 'batchRevokes',
    header: () => <div className="text-right">Batch revokes</div>,
    cell: (info) => <div className="py-1.5 pr-4 text-right text-sm">{formatUsdCents(info.getValue())}</div>,
  }),
  chainColumnHelper.display({
    id: 'total',
    header: () => <div className="text-right">Total</div>,
    cell: (info) => (
      <div className="py-1.5 text-right text-sm font-medium">
        {formatUsdCents(info.row.original.subscriptionsUsdCents + info.row.original.batchRevokesUsdCents)}
      </div>
    ),
  }),
];

const RevenueByChainTable = ({ byChain }: { byChain: ChainRevenue[] }) => {
  const table = useTable({
    data: byChain,
    columns: chainColumns,
    getRowId: (row) => String(row.chainId),
  });

  if (byChain.length === 0) return <EmptyState>No revenue in the selected period</EmptyState>;

  return <Table table={table} loading={false} className="border-none" />;
};

const planColumnHelper = createColumnHelper<PlanRevenue>();

const planColumns = [
  planColumnHelper.accessor('planName', {
    id: 'plan',
    header: 'Plan',
    cell: (info) => <div className="py-1.5 pr-4 text-sm">{info.getValue() ?? info.row.original.planId}</div>,
  }),
  planColumnHelper.accessor('paymentCount', {
    id: 'payments',
    header: () => <div className="text-right">Payments</div>,
    cell: (info) => <div className="py-1.5 pr-4 text-right text-sm">{info.getValue()}</div>,
  }),
  planColumnHelper.accessor('totalUsdCents', {
    id: 'revenue',
    header: () => <div className="text-right">Revenue</div>,
    cell: (info) => <div className="py-1.5 text-right text-sm font-medium">{formatUsdCents(info.getValue())}</div>,
  }),
];

const RevenueByPlanTable = ({ byPlan }: { byPlan: PlanRevenue[] }) => {
  const table = useTable({
    data: byPlan,
    columns: planColumns,
    getRowId: (row) => row.planId,
  });

  if (byPlan.length === 0) return <EmptyState>No subscription payments in the selected period</EmptyState>;

  return <Table table={table} loading={false} className="border-none" />;
};

export default RevenueBreakdownSection;
