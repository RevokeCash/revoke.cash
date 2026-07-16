'use client';

import type { ExecutorSpend } from '@revoke.cash/core/admin/executor';
import type { ExecutionLane } from '@revoke.cash/core/auto-revoke/execution/signer';
import { formatFiatAmount } from '@revoke.cash/core/utils/formatting';
import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import Card, { CardTitle } from 'components/common/Card';
import ChainDisplay from 'components/common/ChainDisplay';
import EmptyState from 'components/common/EmptyState';
import Table from 'components/common/table/Table';
import { useAdminBalances } from 'lib/hooks/admin/useAdminOverview';
import { useMemo } from 'react';
import { twMerge } from 'tailwind-merge';

const LANES: ExecutionLane[] = ['normal', 'urgent'];

// The total row is part of the table data, marked by a null chainId
interface LaneSpendRow {
  chainId: number | null;
  actionCount: number;
  spendUsd: number;
}

const columnHelper = createColumnHelper<LaneSpendRow>();

const columns = [
  columnHelper.accessor('chainId', {
    id: 'chain',
    header: 'Chain',
    cell: (info) => {
      const chainId = info.getValue();

      return (
        <div className={twMerge('py-1.5 pr-4', chainId === null && 'font-medium')}>
          {chainId === null ? 'Total' : <ChainDisplay chainId={chainId} />}
        </div>
      );
    },
  }),
  columnHelper.accessor('actionCount', {
    id: 'actions',
    header: () => <div className="text-right">Actions</div>,
    cell: (info) => (
      <div className={twMerge('py-1.5 pr-4 text-right', info.row.original.chainId === null && 'font-medium')}>
        {info.getValue()}
      </div>
    ),
  }),
  columnHelper.accessor('spendUsd', {
    id: 'spend',
    header: () => <div className="text-right">Spend</div>,
    cell: (info) => (
      <div className={twMerge('py-1.5 text-right', info.row.original.chainId === null && 'font-medium')}>
        {formatFiatAmount(info.getValue())}
      </div>
    ),
  }),
];

const ExecutorSpendSection = () => {
  const { data, isLoading } = useAdminBalances();

  const spend30d = data?.spend30d ?? [];

  return (
    <Card
      header={<CardTitle title="30-day gas spend" subtitle="Realized executor gas spend per lane and chain" />}
      isLoading={isLoading}
    >
      {spend30d.length === 0 ? (
        <EmptyState>No executor gas spend in the last 30 days</EmptyState>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {LANES.map((lane) => (
            <LaneSpendTable key={lane} lane={lane} spend={spend30d.filter((entry) => entry.lane === lane)} />
          ))}
        </div>
      )}
    </Card>
  );
};

interface LaneSpendTableProps {
  lane: ExecutionLane;
  spend: ExecutorSpend[];
}

const LaneSpendTable = ({ lane, spend }: LaneSpendTableProps) => {
  const rows: LaneSpendRow[] = useMemo(() => {
    const sortedSpend = [...spend].sort((a, b) => b.spendUsd - a.spendUsd);
    const totalActionCount = spend.reduce((total, entry) => total + entry.actionCount, 0);
    const totalSpendUsd = spend.reduce((total, entry) => total + entry.spendUsd, 0);

    return [...sortedSpend, { chainId: null, actionCount: totalActionCount, spendUsd: totalSpendUsd }];
  }, [spend]);

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => (row.chainId === null ? 'total' : String(row.chainId)),
  });

  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-medium">{lane === 'normal' ? 'Normal lane' : 'Urgent lane'}</h3>
      {spend.length === 0 ? (
        <span className="text-sm text-zinc-500">No spend in this lane</span>
      ) : (
        <Table table={table} loading={false} className="border-none" />
      )}
    </div>
  );
};

export default ExecutorSpendSection;
