'use client';

import type { AdminPayment } from '@revoke.cash/core/admin/subscriptions';
import Card, { CardTitle } from 'components/common/Card';
import Table from 'components/common/table/Table';
import { useTable } from 'lib/hooks/useTable';
import { columns } from './columns';

interface Props {
  payments: AdminPayment[];
}

const SubscriptionPaymentsCard = ({ payments }: Props) => {
  const table = useTable({
    data: payments,
    columns,
    getRowId: (row) => row.id,
  });

  return (
    <Card
      header={<CardTitle title="Payments" subtitle="All payments for this subscription, including unconfirmed ones" />}
      className="p-0"
    >
      <Table table={table} loading={false} emptyChildren="No payments" className="border-none rounded-none" />
    </Card>
  );
};

export default SubscriptionPaymentsCard;
