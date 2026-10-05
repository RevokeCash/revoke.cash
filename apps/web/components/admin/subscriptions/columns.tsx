import type { AdminSubscriptionListItem } from '@revoke.cash/core/admin/subscriptions';
import { formatUsdCents } from '@revoke.cash/core/utils/formatting';
import { formatDate, formatDateNormalised } from '@revoke.cash/core/utils/time';
import { createColumnHelper } from '@tanstack/react-table';
import AdminAddressLink from 'components/admin/common/AdminAddressLink';
import Button from 'components/common/Button';
import StatusLabel from 'components/common/StatusLabel';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import type { AppTableFeatures } from 'lib/utils/table';
import SubscriptionPlanLabel from './SubscriptionPlanLabel';
import SubscriptionStatusBadge from './SubscriptionStatusBadge';

const columnHelper = createColumnHelper<AppTableFeatures, AdminSubscriptionListItem>();

export const columns = columnHelper.columns([
  columnHelper.accessor('ownerAddress', {
    id: 'owner',
    header: 'Owner',
    cell: (info) => <AdminAddressLink address={info.getValue()} />,
  }),
  columnHelper.accessor('planName', {
    id: 'plan',
    header: 'Plan',
    cell: (info) => (
      <div className="py-2">
        <SubscriptionPlanLabel planName={info.getValue()} tier={info.row.original.tier} />
      </div>
    ),
  }),
  columnHelper.accessor('isActive', {
    id: 'status',
    header: 'Status',
    cell: (info) => <SubscriptionStatusBadge isActive={info.getValue()} />,
  }),
  columnHelper.accessor('startsAt', {
    id: 'period',
    header: 'Period',
    cell: (info) => (
      <WithHoverTooltip tooltip={`Started ${formatDateNormalised(new Date(info.getValue()))}`}>
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          {formatDate(info.getValue())} - {formatDate(info.row.original.endsAt)}
        </span>
      </WithHoverTooltip>
    ),
  }),
  columnHelper.accessor('addressCount', {
    id: 'addresses',
    header: 'Addresses',
    cell: (info) => (
      <span>
        {info.getValue()} / {info.row.original.maxAddresses}
      </span>
    ),
  }),
  columnHelper.accessor('autoRevokeCoverage', {
    id: 'autoRevoke',
    header: 'Auto-Revoke',
    cell: (info) => {
      const coverage = info.getValue();
      if (!coverage) return <span>-</span>;

      const { protectedChainCount, notUpgradedPermissionCount, blockedActionCount } = coverage;
      const hasLivePermission = protectedChainCount > 0 || notUpgradedPermissionCount > 0;

      return (
        <div className="flex items-center gap-2 py-2">
          {protectedChainCount > 0 && (
            <WithHoverTooltip tooltip="Chains where at least one wallet has a live permission and is upgraded">
              <span>
                {protectedChainCount} {protectedChainCount === 1 ? 'chain' : 'chains'}
              </span>
            </WithHoverTooltip>
          )}
          {!hasLivePermission && (
            <StatusLabel status={info.row.original.isActive ? 'warning' : 'neutral'} className="py-0.75">
              Not set up
            </StatusLabel>
          )}
          {notUpgradedPermissionCount > 0 && (
            <WithHoverTooltip tooltip="Live permissions whose wallet has no MetaMask delegator code on that chain. They protect nothing until the wallet upgrades.">
              <StatusLabel status={info.row.original.isActive ? 'warning' : 'neutral'} className="py-0.75">
                {notUpgradedPermissionCount} not upgraded
              </StatusLabel>
            </WithHoverTooltip>
          )}
          {blockedActionCount > 0 && (
            <WithHoverTooltip tooltip="Flagged approvals waiting as blocked_permission for a permission or a wallet upgrade. They stay parked after the user revokes them by hand.">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">{blockedActionCount} parked</span>
            </WithHoverTooltip>
          )}
        </div>
      );
    },
  }),
  columnHelper.accessor('confirmedPaymentCount', {
    id: 'payments',
    header: 'Payments',
    cell: (info) => <span>{info.getValue()}</span>,
  }),
  columnHelper.accessor('totalPaidUsdCents', {
    id: 'totalPaid',
    header: 'Total paid',
    cell: (info) => <span>{formatUsdCents(info.getValue())}</span>,
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
