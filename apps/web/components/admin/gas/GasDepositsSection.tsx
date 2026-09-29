'use client';

import type { GasDepositChainSummary } from '@revoke.cash/core/admin/gas-wallets';
import { AUTO_REVOKE_SUPPORTED_CHAINS } from '@revoke.cash/core/auto-revoke/config';
import { formatUsdCents } from '@revoke.cash/core/utils/formatting';
import { createColumnHelper } from '@tanstack/react-table';
import Button from 'components/common/Button';
import Card, { CardHeader } from 'components/common/Card';
import ChainDisplay from 'components/common/ChainDisplay';
import Table from 'components/common/table/Table';
import { formatNativeAmount } from 'lib/admin/format';
import { useAdminGasWallets } from 'lib/hooks/admin/useAdminGas';
import { useTable } from 'lib/hooks/useTable';
import type { AppTableFeatures } from 'lib/utils/table';
import { useMemo } from 'react';
import { twMerge } from 'tailwind-merge';

// The total row is part of the table data, marked by a null chainId. Only the USD value adds up across chains.
type DepositRow = GasDepositChainSummary | { chainId: null; depositCount: number; valueUsdCents: number };

interface Props {
  from: string;
  to: string;
}

const GasDepositsSection = ({ from, to }: Props) => {
  const { data, isLoading, isPlaceholderData, error } = useAdminGasWallets(from, to);

  const rows = useMemo((): DepositRow[] => {
    if (!data || data.depositSummary.length === 0) return [];

    const totalRow: DepositRow = {
      chainId: null,
      depositCount: data.depositCount,
      valueUsdCents: data.depositSummary.reduce((sum, row) => sum + row.valueUsdCents, 0),
    };

    return [...data.depositSummary, totalRow];
  }, [data]);

  const table = useTable({
    data: rows,
    columns,
    getRowId: (row) => (row.chainId === null ? 'total' : String(row.chainId)),
    // One row per chain plus the total row, so the total stays on the single page
    pageSize: AUTO_REVOKE_SUPPORTED_CHAINS.length + 1,
  });

  const csvUrl = `/api/admin/gas/wallets?${new URLSearchParams({ from, to, format: 'csv' })}`;

  return (
    <Card
      header={
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-xl">Deposits</h2>
              <p>Native token deposits into the executor wallets, valued at the time of each deposit</p>
            </div>
            <Button style="secondary" size="sm" href={csvUrl}>
              Download CSV
            </Button>
          </div>
        </CardHeader>
      }
      className="p-0"
    >
      <Table
        table={table}
        loading={isLoading}
        error={error}
        emptyChildren="No deposits in this period"
        className={twMerge('border-none', isPlaceholderData && 'opacity-60')}
      />
    </Card>
  );
};

const columnHelper = createColumnHelper<AppTableFeatures, DepositRow>();

const columns = columnHelper.columns([
  columnHelper.display({
    id: 'chain',
    header: 'Chain',
    cell: (info) => {
      const chainId = info.row.original.chainId;

      return (
        <div className={twMerge('py-1.5 pr-4 text-sm', chainId === null && 'font-medium')}>
          {chainId === null ? 'Total' : <ChainDisplay chainId={chainId} />}
        </div>
      );
    },
  }),
  columnHelper.display({
    id: 'depositCount',
    header: () => <div className="text-right">Deposits</div>,
    cell: (info) => (
      <div className={twMerge('py-1.5 pr-4 text-right text-sm', info.row.original.chainId === null && 'font-medium')}>
        {info.row.original.depositCount}
      </div>
    ),
  }),
  columnHelper.display({
    id: 'amount',
    header: () => <div className="text-right">Amount</div>,
    cell: (info) => {
      const row = info.row.original;

      return (
        <div className="py-1.5 pr-4 text-right text-sm">
          {row.chainId === null ? null : formatNativeAmount(BigInt(row.amountWei), row.nativeToken)}
        </div>
      );
    },
  }),
  columnHelper.display({
    id: 'value',
    header: () => <div className="text-right">Value</div>,
    cell: (info) => (
      <div className={twMerge('py-1.5 text-right text-sm', info.row.original.chainId === null && 'font-medium')}>
        {formatUsdCents(info.row.original.valueUsdCents)}
      </div>
    ),
  }),
]);

export default GasDepositsSection;
