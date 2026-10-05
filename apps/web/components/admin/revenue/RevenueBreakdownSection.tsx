'use client';

import { type ChainRevenue, deriveByChain, deriveByPlan, type PlanRevenue } from '@revoke.cash/core/admin/revenue';
import { getChainName } from '@revoke.cash/core/chains';
import { formatUsdCents } from '@revoke.cash/core/utils/formatting';
import { createColumnHelper } from '@tanstack/react-table';
import Card, { CardTitle } from 'components/common/Card';
import ChainLogo from 'components/common/ChainLogo';
import EmptyState from 'components/common/EmptyState';
import Table from 'components/common/table/Table';
import type { DateRange } from 'lib/admin/date-range';
import { useAdminRevenueDataSince } from 'lib/hooks/admin/useAdminRevenue';
import { useTable } from 'lib/hooks/useTable';
import type { AppTableFeatures } from 'lib/utils/table';
import { twMerge } from 'tailwind-merge';

interface Props {
  range: DateRange;
}

const RevenueBreakdownSection = ({ range }: Props) => {
  const { data, isLoading, isPlaceholderData, error } = useAdminRevenueDataSince(range.from);

  const fromIso = `${range.from}T00:00:00.000Z`;
  const toExclusiveIso = `${range.to}T23:59:59.999Z`;

  return (
    <Card
      header={
        <CardTitle title="Revenue breakdown" subtitle="Confirmed revenue by chain and plan in the selected period" />
      }
      isLoading={isLoading}
      error={error}
      className={twMerge(isLoading && 'h-80')}
    >
      {data && (
        <div
          className={twMerge('flex flex-col gap-6 transition-opacity duration-150', isPlaceholderData && 'opacity-60')}
        >
          <div className="flex flex-col gap-2">
            <h3 className="font-medium">By plan</h3>
            <RevenueByPlanTable byPlan={deriveByPlan(data, fromIso, toExclusiveIso)} />
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="font-medium">By chain</h3>
            <RevenueByChainTable byChain={deriveByChain(data, fromIso, toExclusiveIso)} />
          </div>
        </div>
      )}
    </Card>
  );
};

const chainColumnHelper = createColumnHelper<AppTableFeatures, ChainRevenue>();

const chainColumns = chainColumnHelper.columns([
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
]);

const RevenueByChainTable = ({ byChain }: { byChain: ChainRevenue[] }) => {
  const table = useTable({
    data: byChain,
    columns: chainColumns,
    getRowId: (row) => String(row.chainId),
  });

  if (byChain.length === 0) return <EmptyState>No revenue in the selected period</EmptyState>;

  return <Table table={table} loading={false} className="border-none" />;
};

const planColumnHelper = createColumnHelper<AppTableFeatures, PlanRevenue>();

const planColumns = planColumnHelper.columns([
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
]);

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
