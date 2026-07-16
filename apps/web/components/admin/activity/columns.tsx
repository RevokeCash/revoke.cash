import type { AdminActivityItem } from '@revoke.cash/core/admin/activity';
import type { ActionStatus } from '@revoke.cash/core/auto-revoke/actions';
import { shortenAddress } from '@revoke.cash/core/utils/formatting';
import { createColumnHelper } from '@tanstack/react-table';
import AutoRevokeActivityTriggerBadge from 'components/account/auto-revoke/activity/AutoRevokeActivityTriggerBadge';
import AddressCell from 'components/allowances/dashboard/cells/AddressCell';
import AssetDisplay from 'components/allowances/dashboard/cells/AssetDisplay';
import Href from 'components/common/Href';
import TimeAgo from 'components/common/TimeAgo';
import ExpanderCell from 'components/common/table/ExpanderCell';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import HistoryChainCell from 'components/history/cells/HistoryChainCell';
import ActivityStatusCell from './ActivityStatusCell';
import ActivityTxHashCell from './ActivityTxHashCell';
import RetryActionButton from './RetryActionButton';

const RETRYABLE_STATUSES: readonly ActionStatus[] = ['queued', 'blocked_budget', 'blocked_permission', 'blocked_rules'];

const cellClasses = 'pr-4 text-sm';

const columnHelper = createColumnHelper<AdminActivityItem>();

export const columns = [
  columnHelper.accessor('date', {
    id: 'date',
    header: 'Date',
    cell: (info) => (
      <div className={cellClasses}>
        <WithHoverTooltip tooltip={new Date(info.getValue()).toLocaleString()}>
          <span>
            <TimeAgo datetime={info.getValue()} />
          </span>
        </WithHoverTooltip>
      </div>
    ),
  }),
  columnHelper.accessor('address', {
    id: 'wallet',
    header: 'Wallet',
    cell: (info) => (
      <div className={cellClasses}>
        <Href href={`/admin/lookup/${info.getValue()}`} router underline="always" className="font-mono">
          {shortenAddress(info.getValue(), 6)}
        </Href>
      </div>
    ),
  }),
  columnHelper.accessor('chainId', {
    id: 'chain',
    header: 'Chain',
    cell: (info) => (
      <div className={cellClasses}>
        <HistoryChainCell chainId={info.getValue()} />
      </div>
    ),
  }),
  columnHelper.accessor('tokenAddress', {
    id: 'asset',
    header: 'Asset',
    cell: (info) => (
      <div className={cellClasses}>
        <AssetDisplay
          asset={{
            metadata: info.row.original.tokenMetadata,
            chainId: info.row.original.chainId,
            token: { address: info.getValue() },
          }}
        />
      </div>
    ),
  }),
  columnHelper.accessor('spenderAddress', {
    id: 'spender',
    header: 'Spender',
    cell: (info) => (
      <div className={cellClasses}>
        <AddressCell
          address={info.getValue()}
          spenderData={info.row.original.spenderData}
          chainId={info.row.original.chainId}
        />
      </div>
    ),
  }),
  columnHelper.accessor('triggerType', {
    id: 'trigger',
    header: 'Trigger',
    cell: (info) => (
      <div className={cellClasses}>
        <AutoRevokeActivityTriggerBadge triggerType={info.getValue()} />
      </div>
    ),
  }),
  columnHelper.accessor('status', {
    id: 'status',
    header: 'Status',
    cell: (info) => (
      <div className={cellClasses}>
        <ActivityStatusCell
          status={info.getValue()}
          errorCode={info.row.original.errorCode}
          nextRetryAt={info.row.original.nextRetryAt}
        />
      </div>
    ),
  }),
  columnHelper.accessor('errorCode', {
    id: 'error',
    header: 'Error',
    cell: (info) => (
      <div className={cellClasses}>
        <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400">{info.getValue() ?? '-'}</span>
      </div>
    ),
  }),
  columnHelper.accessor('lane', {
    id: 'lane',
    header: 'Lane',
    cell: (info) => (
      <div className={cellClasses}>
        <span className="text-zinc-600 dark:text-zinc-400">{info.getValue() ?? '-'}</span>
      </div>
    ),
  }),
  columnHelper.accessor('costUsd', {
    id: 'cost',
    header: 'Cost',
    cell: (info) => {
      const costUsd = info.getValue();
      return (
        <div className={cellClasses}>
          <span className="text-zinc-600 dark:text-zinc-400">{costUsd === null ? '-' : `$${costUsd.toFixed(2)}`}</span>
        </div>
      );
    },
  }),
  columnHelper.accessor('txHash', {
    id: 'tx',
    header: 'Tx',
    cell: (info) => (
      <div className={cellClasses}>
        <ActivityTxHashCell
          chainId={info.row.original.chainId}
          txHash={info.getValue()}
          txHashes={info.row.original.txHashes}
        />
      </div>
    ),
  }),
  columnHelper.display({
    id: 'actions',
    header: () => null,
    cell: ({ row }) => (
      <ExpanderCell row={row}>
        {RETRYABLE_STATUSES.includes(row.original.status) && <RetryActionButton actionId={row.original.id} />}
      </ExpanderCell>
    ),
  }),
];
