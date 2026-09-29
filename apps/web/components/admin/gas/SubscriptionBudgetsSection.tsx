'use client';

import type { GasBudgetSubscription } from '@revoke.cash/core/admin/gas-budgets';
import { AUTO_REVOKE_MONTHLY_GAS_BUDGET_USD } from '@revoke.cash/core/auto-revoke/config';
import { formatDate } from '@revoke.cash/core/utils/time';
import { createColumnHelper } from '@tanstack/react-table';
import AdminAddressLink from 'components/admin/common/AdminAddressLink';
import Button from 'components/common/Button';
import Card, { CardHeader } from 'components/common/Card';
import StatusLabel, { type Status } from 'components/common/StatusLabel';
import Table from 'components/common/table/Table';
import { formatPercentage, formatUsd } from 'lib/admin/format';
import { useAdminGasBudgets } from 'lib/hooks/admin/useAdminGas';
import { useTable } from 'lib/hooks/useTable';
import type { AppTableFeatures } from 'lib/utils/table';
import { twMerge } from 'tailwind-merge';

interface Props {
  from: string;
  to: string;
}

const SubscriptionBudgetsSection = ({ from, to }: Props) => {
  const { data, isLoading, isPlaceholderData, error } = useAdminGasBudgets(from, to);

  const table = useTable({
    data: data?.subscriptions ?? [],
    columns,
    getRowId: (row) => row.id,
    pageSize: 10,
  });

  return (
    <Card
      header={
        <CardHeader>
          <h2 className="text-xl">Ultimate subscription budgets</h2>
          <p>
            Gas budget use of active Ultimate subscriptions. The average covers the months in the period since the
            subscription first used gas, including the running month.
          </p>
          {data && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {data.blockedActionCount.toLocaleString()} actions blocked by the budget ·{' '}
              {data.awaitingCheapGasActionCount.toLocaleString()} actions waiting for cheaper gas
            </p>
          )}
        </CardHeader>
      }
      className="p-0"
    >
      <Table
        table={table}
        loading={isLoading}
        error={error}
        emptyChildren="No active Ultimate subscriptions"
        className={twMerge('border-none', isPlaceholderData && 'opacity-60')}
      />
    </Card>
  );
};

const budgetUsageStatus = (usageUsd: number): Status => {
  const budgetFraction = usageUsd / AUTO_REVOKE_MONTHLY_GAS_BUDGET_USD;
  if (budgetFraction >= 1) return 'danger';
  if (budgetFraction >= 0.8) return 'warning';
  return 'neutral';
};

const columnHelper = createColumnHelper<AppTableFeatures, GasBudgetSubscription>();

const columns = columnHelper.columns([
  columnHelper.accessor('ownerAddress', {
    id: 'owner',
    header: 'Owner',
    cell: (info) => <AdminAddressLink address={info.getValue()} />,
  }),
  columnHelper.accessor('planName', {
    id: 'plan',
    header: 'Plan',
    cell: (info) => <div className="py-1.5 pr-4 text-sm">{info.getValue()}</div>,
  }),
  columnHelper.accessor('endsAt', {
    id: 'endsAt',
    header: 'Ends',
    cell: (info) => (
      <div className="py-1.5 pr-4 text-sm text-zinc-600 dark:text-zinc-400">{formatDate(info.getValue())}</div>
    ),
  }),
  columnHelper.accessor('currentMonthUsageUsd', {
    id: 'currentMonth',
    header: () => <div className="text-right">This month</div>,
    cell: (info) => (
      <div className="flex items-center justify-end gap-2 py-1.5 pr-4 text-sm">
        {formatUsd(info.getValue())}
        <StatusLabel status={budgetUsageStatus(info.getValue())}>
          {formatPercentage(info.getValue() / AUTO_REVOKE_MONTHLY_GAS_BUDGET_USD)}
        </StatusLabel>
      </div>
    ),
  }),
  columnHelper.accessor('averageMonthlyUsageUsd', {
    id: 'averageMonthly',
    header: () => <div className="text-right">Average per month</div>,
    cell: (info) => {
      const averageUsageUsd = info.getValue();

      return (
        <div className="py-1.5 pr-4 text-right text-sm">
          {averageUsageUsd === null ? (
            <span className="text-zinc-500">-</span>
          ) : (
            <>
              {formatUsd(averageUsageUsd)}{' '}
              <span className="text-xs text-zinc-500">
                ({info.row.original.averagedMonthCount}{' '}
                {info.row.original.averagedMonthCount === 1 ? 'month' : 'months'})
              </span>
            </>
          )}
        </div>
      );
    },
  }),
  columnHelper.display({
    id: 'details',
    header: () => null,
    cell: (info) => (
      <div className="flex justify-end">
        <Button style="secondary" size="sm" router href={`/admin/subscriptions/${info.row.original.id}`}>
          View
        </Button>
      </div>
    ),
  }),
]);

export default SubscriptionBudgetsSection;
