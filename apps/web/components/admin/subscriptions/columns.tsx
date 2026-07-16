import type { AdminSubscriptionListItem } from '@revoke.cash/core/admin/subscriptions';
import { formatUsdCents } from '@revoke.cash/core/utils/formatting';
import { formatDate } from '@revoke.cash/core/utils/time';
import { createColumnHelper } from '@tanstack/react-table';
import AdminAddressLink from 'components/admin/common/AdminAddressLink';
import Button from 'components/common/Button';
import SubscriptionPlanLabel from './SubscriptionPlanLabel';
import SubscriptionStatusBadge from './SubscriptionStatusBadge';

const columnHelper = createColumnHelper<AdminSubscriptionListItem>();

export const columns = [
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
      <span className="text-sm text-zinc-600 dark:text-zinc-400">
        {formatDate(info.getValue())} - {formatDate(info.row.original.endsAt)}
      </span>
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
];
