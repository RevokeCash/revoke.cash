import type { AdminAuditEvent } from '@revoke.cash/core/admin/audit';
import type { AuditAction } from '@revoke.cash/core/audit/actions';
import { shortenAddress } from '@revoke.cash/core/utils/formatting';
import { createColumnHelper } from '@tanstack/react-table';
import Href from 'components/common/Href';
import TimeAgo from 'components/common/TimeAgo';
import ExpanderCell from 'components/common/table/ExpanderCell';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import HistoryChainCell from 'components/history/cells/HistoryChainCell';

const cellClasses = 'pr-4 text-sm';

const formatAuditActionLabel = (action: AuditAction): string => action.replaceAll('_', ' ');

const columnHelper = createColumnHelper<AdminAuditEvent>();

export const columns = [
  columnHelper.accessor('createdAt', {
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
  columnHelper.accessor('action', {
    id: 'action',
    header: 'Action',
    cell: (info) => (
      <div className={cellClasses}>
        <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
          {formatAuditActionLabel(info.getValue())}
        </span>
      </div>
    ),
  }),
  columnHelper.accessor('actorAddress', {
    id: 'actor',
    header: 'Actor',
    cell: (info) => (
      <div className={cellClasses}>
        <Href href={`/admin/lookup/${info.getValue()}`} router underline="always" className="font-mono">
          {shortenAddress(info.getValue(), 6)}
        </Href>
      </div>
    ),
  }),
  columnHelper.accessor('targetAddress', {
    id: 'target',
    header: 'Target',
    cell: (info) => {
      const targetAddress = info.getValue();
      return (
        <div className={cellClasses}>
          {targetAddress ? (
            <Href href={`/admin/lookup/${targetAddress}`} router underline="always" className="font-mono">
              {shortenAddress(targetAddress, 6)}
            </Href>
          ) : (
            <span className="text-zinc-600 dark:text-zinc-400">-</span>
          )}
        </div>
      );
    },
  }),
  columnHelper.accessor('subscriptionId', {
    id: 'subscription',
    header: 'Subscription',
    cell: (info) => {
      const subscriptionId = info.getValue();
      return (
        <div className={cellClasses}>
          {subscriptionId ? (
            <Href href={`/admin/subscriptions/${subscriptionId}`} router underline="always">
              View subscription
            </Href>
          ) : (
            <span className="text-zinc-600 dark:text-zinc-400">-</span>
          )}
        </div>
      );
    },
  }),
  columnHelper.accessor('chainId', {
    id: 'chain',
    header: 'Chain',
    cell: (info) => {
      const chainId = info.getValue();
      return (
        <div className={cellClasses}>
          {chainId !== null ? (
            <HistoryChainCell chainId={chainId} />
          ) : (
            <span className="text-zinc-600 dark:text-zinc-400">-</span>
          )}
        </div>
      );
    },
  }),
  columnHelper.display({
    id: 'expander',
    header: () => null,
    cell: ({ row }) => <ExpanderCell row={row} />,
  }),
];
