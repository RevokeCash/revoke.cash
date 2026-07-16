'use client';

import type { StuckPendingPaymentRow } from '@revoke.cash/core/admin/health';
import { formatUsdCents } from '@revoke.cash/core/utils/formatting';
import { createColumnHelper } from '@tanstack/react-table';
import AdminAddressLink from 'components/admin/common/AdminAddressLink';
import TimeAgoCell from 'components/admin/common/TimeAgoCell';
import ChainDisplay from 'components/common/ChainDisplay';
import Href from 'components/common/Href';
import { useAdminStuckPayments } from 'lib/hooks/admin/useAdminHealthDetails';
import HealthDetailPanel from './HealthDetailPanel';

interface Props {
  isOpen: boolean;
}

const columnHelper = createColumnHelper<StuckPendingPaymentRow>();

const columns = [
  columnHelper.accessor('ownerAddress', {
    id: 'owner',
    header: 'Owner',
    cell: (info) => (
      <div className="py-1.5 pr-4 text-sm">
        <AdminAddressLink address={info.getValue()} />
      </div>
    ),
  }),
  columnHelper.accessor('amountUsdCents', {
    id: 'amount',
    header: 'Amount',
    cell: (info) => <div className="py-1.5 pr-4 text-sm">{formatUsdCents(info.getValue())}</div>,
  }),
  columnHelper.accessor('chainId', {
    id: 'chain',
    header: 'Chain',
    cell: (info) => (
      <div className="py-1.5 pr-4 text-sm">
        <ChainDisplay chainId={info.getValue()} />
      </div>
    ),
  }),
  columnHelper.accessor('createdAt', {
    id: 'created',
    header: 'Created',
    cell: (info) => (
      <div className="py-1.5 pr-4 text-sm">
        <TimeAgoCell timestamp={info.getValue()} />
      </div>
    ),
  }),
  columnHelper.accessor('expiresAt', {
    id: 'expired',
    header: 'Expired',
    cell: (info) => (
      <div className="py-1.5 pr-4 text-sm">
        <TimeAgoCell timestamp={info.getValue()} />
      </div>
    ),
  }),
  columnHelper.accessor('subscriptionId', {
    id: 'subscription',
    header: 'Subscription',
    cell: (info) => {
      const subscriptionId = info.getValue();
      return (
        <div className="py-1.5 text-sm">
          {subscriptionId ? (
            <Href href={`/admin/subscriptions/${subscriptionId}`} router underline="always">
              View subscription
            </Href>
          ) : (
            <span className="text-zinc-500">-</span>
          )}
        </div>
      );
    },
  }),
];

const StuckPaymentsPanel = ({ isOpen }: Props) => {
  const query = useAdminStuckPayments(isOpen);

  return (
    <HealthDetailPanel
      isOpen={isOpen}
      query={query}
      columns={columns}
      getRowId={(row) => row.id}
      emptyChildren="No payments stuck pending"
    />
  );
};

export default StuckPaymentsPanel;
