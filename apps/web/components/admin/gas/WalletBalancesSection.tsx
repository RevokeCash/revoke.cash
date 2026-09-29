'use client';

import type { GasWalletChainBalance } from '@revoke.cash/core/admin/gas-wallets';
import { AUTO_REVOKE_SUPPORTED_CHAINS } from '@revoke.cash/core/auto-revoke/config';
import { createColumnHelper } from '@tanstack/react-table';
import Card, { CardTitle } from 'components/common/Card';
import ChainDisplay from 'components/common/ChainDisplay';
import Table from 'components/common/table/Table';
import { formatNativeAmount, formatUsd } from 'lib/admin/format';
import { useAdminGasWallets } from 'lib/hooks/admin/useAdminGas';
import { useTable } from 'lib/hooks/useTable';
import type { AppTableFeatures } from 'lib/utils/table';
import { useMemo } from 'react';
import { twMerge } from 'tailwind-merge';

// The total row is part of the table data, marked by a null chainId. Only the USD value adds up across chains.
type BalanceRow = GasWalletChainBalance | { chainId: null; closingValueUsd: number };

interface Props {
  from: string;
  to: string;
}

const WalletBalancesSection = ({ from, to }: Props) => {
  const { data, isLoading, isPlaceholderData, error } = useAdminGasWallets(from, to);

  const rows = useMemo((): BalanceRow[] => {
    if (!data || data.balances.length === 0) return [];

    const closingValueUsd = data.balances.reduce((sum, balance) => sum + balance.closingValueUsd, 0);
    return [...data.balances, { chainId: null, closingValueUsd }];
  }, [data]);

  const table = useTable({
    data: rows,
    columns,
    getRowId: (row) => (row.chainId === null ? 'total' : String(row.chainId)),
    // One row per chain plus the total row, so the total stays on the single page
    pageSize: AUTO_REVOKE_SUPPORTED_CHAINS.length + 1,
  });

  return (
    <Card
      header={
        <CardTitle
          title="Wallet balances"
          subtitle="Both executor wallets per chain: opening balance + deposits - spent = closing balance. Spent contains all gas that the wallets paid."
        />
      }
      className="p-0"
    >
      <Table
        table={table}
        loading={isLoading}
        error={error}
        emptyChildren="The executor wallets were not funded yet in this period"
        className={twMerge('border-none', isPlaceholderData && 'opacity-60')}
      />
    </Card>
  );
};

const columnHelper = createColumnHelper<AppTableFeatures, BalanceRow>();

const nativeAmountColumn = (id: string, header: string, getAmountWei: (balance: GasWalletChainBalance) => string) =>
  columnHelper.display({
    id,
    header: () => <div className="text-right">{header}</div>,
    cell: (info) => {
      const row = info.row.original;

      return (
        <div className="py-1.5 pr-4 text-right text-sm">
          {row.chainId === null ? null : formatNativeAmount(BigInt(getAmountWei(row)), row.nativeToken)}
        </div>
      );
    },
  });

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
  nativeAmountColumn('opening', 'Opening', (balance) => balance.openingBalanceWei),
  nativeAmountColumn('deposited', 'Deposits', (balance) => balance.depositedWei),
  nativeAmountColumn('spent', 'Spent', (balance) => balance.spentWei),
  nativeAmountColumn('closing', 'Closing', (balance) => balance.closingBalanceWei),
  columnHelper.display({
    id: 'closingValue',
    header: () => <div className="text-right">Value at close</div>,
    cell: (info) => (
      <div className={twMerge('py-1.5 text-right text-sm', info.row.original.chainId === null && 'font-medium')}>
        {formatUsd(info.row.original.closingValueUsd)}
      </div>
    ),
  }),
]);

export default WalletBalancesSection;
