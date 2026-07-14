'use client';

import type { ExecutorGasBalance, ExecutorSpend } from '@revoke.cash/core/admin/executor';
import { getChainName } from '@revoke.cash/core/chains';
import { deduplicateArray } from '@revoke.cash/core/utils';
import { formatFiatAmount } from '@revoke.cash/core/utils/formatting';
import { createColumnHelper } from '@tanstack/react-table';
import Card, { CardTitle } from 'components/common/Card';
import ChainLogo from 'components/common/ChainLogo';
import StatusLabel, { type Status } from 'components/common/StatusLabel';
import Table from 'components/common/table/Table';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { useAdminBalances } from 'lib/hooks/admin/useAdminOverview';
import { useTable } from 'lib/hooks/useTable';
import { useMemo } from 'react';

const columnHelper = createColumnHelper<number>();

const ExecutorBalancesSection = () => {
  const { data, isLoading, error } = useAdminBalances();

  const chainIds = useMemo(() => deduplicateArray((data?.balances ?? []).map((balance) => balance.chainId)), [data]);

  const columns = useMemo(() => {
    const laneColumn = (lane: ExecutorGasBalance['lane'], header: string) =>
      columnHelper.display({
        id: lane,
        header,
        cell: (info) => (
          <div className="py-1.5 pr-4 text-sm">
            <BalanceCell
              balance={data?.balances.find((entry) => entry.chainId === info.row.original && entry.lane === lane)}
              spend={data?.spend30d.find((entry) => entry.chainId === info.row.original && entry.lane === lane)}
            />
          </div>
        ),
      });

    return [
      columnHelper.display({
        id: 'chain',
        header: 'Chain',
        cell: (info) => (
          <div className="flex items-center gap-2 py-1.5 pr-4 text-sm">
            <ChainLogo chainId={info.row.original} size={20} />
            {getChainName(info.row.original)}
          </div>
        ),
      }),
      laneColumn('normal', 'Normal lane'),
      laneColumn('urgent', 'Urgent lane'),
    ];
  }, [data]);

  const table = useTable({
    data: chainIds,
    columns,
    getRowId: (chainId) => String(chainId),
  });

  return (
    <Card
      header={
        <CardTitle
          title="Executor gas balances"
          subtitle="Hot wallet balances per chain with days of runway based on trailing 30-day spend"
        />
      }
      className="p-0"
    >
      <Table table={table} loading={isLoading} error={error} className="border-none" />
    </Card>
  );
};

interface BalanceCellProps {
  balance?: ExecutorGasBalance;
  spend?: ExecutorSpend;
}

const BalanceCell = ({ balance, spend }: BalanceCellProps) => {
  if (!balance) return <span className="text-zinc-500">-</span>;

  if (balance.balance === null) {
    return <span className="text-zinc-500">RPC error</span>;
  }

  const balanceDisplay = `${Number(balance.balance).toFixed(4)} ${balance.nativeToken}`;

  const spendPerDayUsd = spend ? spend.spendUsd / 30 : 0;
  const runwayDays = balance.balanceUsd !== null && spendPerDayUsd > 0 ? balance.balanceUsd / spendPerDayUsd : null;

  return (
    <WithHoverTooltip
      tooltip={`30-day spend: ${formatFiatAmount(spend?.spendUsd ?? 0)} (${spend?.actionCount ?? 0} actions), runway at 30d spend rate: ${formatRunwayDisplay(runwayDays)}`}
    >
      <div className="flex w-fit flex-col items-start gap-0.5">
        {balance.balanceUsd !== null ? (
          <StatusLabel status={runwayStatus(runwayDays)}>{formatFiatAmount(balance.balanceUsd)}</StatusLabel>
        ) : (
          <StatusLabel status="neutral">no price</StatusLabel>
        )}
        <span className="text-xs text-zinc-500">
          {balanceDisplay} - {formatRunwayDisplay(runwayDays)}
        </span>
      </div>
    </WithHoverTooltip>
  );
};

// Balances with no recent spend have effectively unlimited runway
const runwayStatus = (runwayDays: number | null): Status => {
  if (runwayDays === null) return 'success';
  if (runwayDays < 3) return 'danger';
  if (runwayDays < 7) return 'severe';
  if (runwayDays < 14) return 'warning';
  return 'success';
};

const formatRunwayDisplay = (runwayDays: number | null): string => {
  if (runwayDays === null) return 'no recent spend';
  if (runwayDays > 365) return '>1y runway';
  return `${Math.floor(runwayDays)}d runway`;
};

export default ExecutorBalancesSection;
