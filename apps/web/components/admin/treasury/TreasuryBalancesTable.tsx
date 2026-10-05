'use client';

import type { TreasuryRoute } from '@revoke.cash/core/admin/treasury-routes';
import type { Nullable } from '@revoke.cash/core/types';
import { formatFiatAmount, formatFixedPointBigInt } from '@revoke.cash/core/utils/formatting';
import { createColumnHelper } from '@tanstack/react-table';
import ChainDisplay from 'components/common/ChainDisplay';
import Table from 'components/common/table/Table';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { useTable } from 'lib/hooks/useTable';
import type { AppTableFeatures } from 'lib/utils/table';
import { type ReactNode, useMemo } from 'react';
import TreasuryRouteCell from './TreasuryRouteCell';

export interface TreasuryBalanceRow {
  id: string;
  chainId: number;
  tokenSymbol: string;
  decimals: number;
  // Raw balance in the smallest unit; null when the balance could not be read
  balance: string | null;
  priceUsd: number | null;
  balanceUsd: number | null;
  route: TreasuryRoute | null;
  // Native token that the address lacks to pay the gas for moving a token balance; native balances pay their own gas
  missingGasToken?: string;
}

interface Props {
  rows: TreasuryBalanceRow[];
  isLoading: boolean;
  error?: Nullable<Error>;
  emptyChildren?: ReactNode;
}

const columnHelper = createColumnHelper<AppTableFeatures, TreasuryBalanceRow>();

// Every balance fits on a single page, since the point of these tables is to see all chains at once
const PAGE_SIZE = 100;

// A full page of placeholder rows would push everything below far down while the balances load
const LOADING_ROWS = 5;

// Shared table for the treasury balance sections, which all show a balance and its dollar value per chain
const TreasuryBalancesTable = ({ rows, isLoading, error, emptyChildren }: Props) => {
  const columns = useMemo(() => {
    const totalUsd = rows.reduce((total, row) => total + (row.balanceUsd ?? 0), 0);

    // A total of zero before the balances have loaded would read as a real number, so the total row
    // only appears once there is something to add up
    const totalFooter = (content: ReactNode) => (rows.length > 0 ? () => content : undefined);

    return columnHelper.columns([
      columnHelper.accessor('chainId', {
        id: 'chain',
        header: 'Chain',
        footer: totalFooter(<span className="font-medium">Total</span>),
        cell: (info) => (
          <div className="py-1.5 pr-4 text-sm">
            <ChainDisplay chainId={info.getValue()} />
          </div>
        ),
      }),
      columnHelper.display({
        id: 'balance',
        header: 'Balance',
        cell: (info) => (
          <div className="py-1.5 pr-4 text-sm">
            <BalanceDisplay row={info.row.original} />
          </div>
        ),
      }),
      columnHelper.display({
        id: 'route',
        header: 'Route',
        cell: (info) => (
          <div className="py-1.5 pr-4 text-sm">
            <TreasuryRouteCell row={info.row.original} />
          </div>
        ),
      }),
      columnHelper.accessor('balanceUsd', {
        id: 'value',
        header: () => <div className="text-right">Value</div>,
        footer: totalFooter(<div className="text-right font-medium">{formatFiatAmount(totalUsd)}</div>),
        cell: (info) => (
          <div className="py-1.5 text-right text-sm">
            <ValueDisplay row={info.row.original} />
          </div>
        ),
      }),
    ]);
  }, [rows]);

  const table = useTable({ data: rows, columns, getRowId: (row) => row.id, pageSize: PAGE_SIZE });

  return (
    <Table
      table={table}
      loading={isLoading}
      loadingRows={LOADING_ROWS}
      error={error}
      emptyChildren={emptyChildren}
      className="border-none"
    />
  );
};

interface DisplayProps {
  row: TreasuryBalanceRow;
}

const BalanceDisplay = ({ row }: DisplayProps) => {
  if (row.balance === null) return <span className="text-zinc-500">RPC error</span>;

  return (
    <span>
      {formatFixedPointBigInt(BigInt(row.balance), row.decimals, 0, 6)} {row.tokenSymbol}
    </span>
  );
};

const ValueDisplay = ({ row }: DisplayProps) => {
  if (row.balanceUsd === null) return <span className="text-zinc-500">no price</span>;

  // Balances of zero are valued without ever looking up a price, so there is nothing to show on hover
  if (row.priceUsd === null) return <span>{formatFiatAmount(row.balanceUsd)}</span>;

  return (
    <WithHoverTooltip tooltip={`1 ${row.tokenSymbol} = ${formatFiatAmount(row.priceUsd, row.priceUsd >= 1 ? 2 : 6)}`}>
      <span>{formatFiatAmount(row.balanceUsd)}</span>
    </WithHoverTooltip>
  );
};

export default TreasuryBalancesTable;
