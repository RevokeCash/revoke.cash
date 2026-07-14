import type { AdminSubscriptionDetail } from '@revoke.cash/core/admin/subscriptions';
import { formatDateNormalised } from '@revoke.cash/core/utils/time';
import AdminAddressLink from 'components/admin/common/AdminAddressLink';
import Card, { CardTitle } from 'components/common/Card';
import EmptyState from 'components/common/EmptyState';

interface Props {
  addresses: AdminSubscriptionDetail['addresses'];
}

const CoveredAddressesCard = ({ addresses }: Props) => (
  <Card
    header={<CardTitle title="Covered addresses" subtitle="Addresses protected under this subscription" />}
    className="p-0"
  >
    {addresses.length === 0 && <EmptyState>No addresses added yet</EmptyState>}
    <div className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
      {addresses.map((entry) => (
        <div key={entry.address} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
          <AdminAddressLink address={entry.address} />
          <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <span>added by</span>
            <AdminAddressLink address={entry.addedBy} />
            <span className="font-monosans">{formatDateNormalised(new Date(entry.createdAt))}</span>
          </div>
        </div>
      ))}
    </div>
  </Card>
);

export default CoveredAddressesCard;
