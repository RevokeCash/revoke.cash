import type { AutoRevokeActivityItem } from '@revoke.cash/core/auto-revoke/activity';
import { SECOND } from '@revoke.cash/core/utils/time';
import { createColumnHelper, type Row } from '@tanstack/react-table';
import AddressCell from 'components/allowances/dashboard/cells/AddressCell';
import AssetDisplay from 'components/allowances/dashboard/cells/AssetDisplay';
import HeaderCell from 'components/allowances/dashboard/cells/HeaderCell';
import TransactionDateCell from 'components/allowances/dashboard/cells/TransactionDateCell';
import HistoryChainCell from 'components/history/cells/HistoryChainCell';
import type { AppTableFeatures } from 'lib/utils/table';
import AutoRevokeActivityStatusBadge, { ACTIVITY_STATUS_KEYS } from './AutoRevokeActivityStatusBadge';
import AutoRevokeActivityTriggerBadge from './AutoRevokeActivityTriggerBadge';

export enum ColumnId {
  WALLET = 'Wallet',
  CHAIN = 'Chain',
  ASSET = 'Asset',
  SPENDER = 'Spender',
  TRIGGER = 'Trigger',
  STATUS = 'Status',
  COST = 'Cost',
  DATE = 'Date',
}

type ActivityRow = Row<AppTableFeatures, AutoRevokeActivityItem>;

// Keeps rows whose column value is one of the selected values (e.g. chain ids or user-facing statuses)
const oneOf = (row: ActivityRow, columnId: string, filterValues: unknown[]) =>
  filterValues.includes(row.getValue(columnId));

// An empty selection removes the filter from the table state instead of hiding every row
oneOf.autoRemove = (filterValues: unknown[] | undefined) => !filterValues || filterValues.length === 0;

const columnHelper = createColumnHelper<AppTableFeatures, AutoRevokeActivityItem>();
export const columns = columnHelper.columns([
  columnHelper.accessor('address', {
    id: ColumnId.WALLET,
    header: () => <HeaderCell i18nKey="account.auto_revoke.activity.columns.wallet" />,
    cell: (info) => <AddressCell address={info.getValue()} chainId={info.row.original.chainId} />,
  }),
  columnHelper.accessor('chainId', {
    id: ColumnId.CHAIN,
    header: () => <HeaderCell i18nKey="account.auto_revoke.activity.columns.chain" />,
    cell: (info) => <HistoryChainCell chainId={info.getValue()} />,
    enableColumnFilter: true,
    filterFn: oneOf,
  }),
  columnHelper.accessor('tokenAddress', {
    id: ColumnId.ASSET,
    header: () => <HeaderCell i18nKey="account.auto_revoke.activity.columns.asset" />,
    cell: (info) => (
      <AssetDisplay
        asset={{
          metadata: info.row.original.tokenMetadata,
          chainId: info.row.original.chainId,
          token: { address: info.getValue() },
        }}
      />
    ),
  }),
  columnHelper.accessor('spenderAddress', {
    id: ColumnId.SPENDER,
    header: () => <HeaderCell i18nKey="account.auto_revoke.activity.columns.spender" />,
    cell: (info) => (
      <AddressCell
        address={info.getValue()}
        spenderData={info.row.original.spenderData}
        chainId={info.row.original.chainId}
      />
    ),
  }),
  columnHelper.accessor('triggerType', {
    id: ColumnId.TRIGGER,
    header: () => <HeaderCell i18nKey="account.auto_revoke.activity.columns.trigger" />,
    cell: (info) => <AutoRevokeActivityTriggerBadge triggerType={info.getValue()} />,
  }),
  // The column value is the user-facing status, so the status filter matches what the badge shows
  columnHelper.accessor((item) => ACTIVITY_STATUS_KEYS[item.status], {
    id: ColumnId.STATUS,
    header: () => <HeaderCell i18nKey="account.auto_revoke.activity.columns.status" />,
    cell: (info) => (
      <AutoRevokeActivityStatusBadge
        status={info.row.original.status}
        errorCode={info.row.original.errorCode}
        errorDetail={info.row.original.errorDetail}
        nextRetryAt={info.row.original.nextRetryAt}
        triggerType={info.row.original.triggerType}
      />
    ),
    enableColumnFilter: true,
    filterFn: oneOf,
  }),
  columnHelper.accessor('costUsd', {
    id: ColumnId.COST,
    header: () => <HeaderCell i18nKey="account.auto_revoke.activity.columns.cost" />,
    cell: (info) => {
      const costUsd = info.getValue();
      return (
        <div className="text-zinc-600 dark:text-zinc-400">{costUsd === null ? '-' : `$${costUsd.toFixed(2)}`}</div>
      );
    },
  }),
  columnHelper.accessor('date', {
    id: ColumnId.DATE,
    header: () => <HeaderCell i18nKey="account.auto_revoke.activity.columns.date" />,
    cell: (info) => (
      <TransactionDateCell
        chainId={info.row.original.chainId}
        timeLog={{
          timestamp: Math.floor(new Date(info.getValue()).getTime() / SECOND),
          transactionHash: info.row.original.txHash ?? undefined,
        }}
      />
    ),
  }),
]);
