'use client';

import type { PremiumSubscription, SubscriptionPayment } from '@revoke.cash/core/premium/types';
import Card, { CardTitle } from 'components/common/Card';
import Table from 'components/common/table/Table';
import { useTable } from 'lib/hooks/useTable';
import { getPaymentRefundStatus } from 'lib/utils/cancellation';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { columns } from './columns';
import PaymentDetailsRow from './PaymentDetailsRow';

interface Props {
  subscriptions: PremiumSubscription[];
  isLoading: boolean;
}

const BillingSection = ({ subscriptions, isLoading }: Props) => {
  const t = useTranslations();

  // Payments are ordered per subscription by the API; re-sort the combined list so payments from
  // different subscriptions are in reverse chronological order overall.
  const data: SubscriptionPayment[] = useMemo(
    () => subscriptions.flatMap((sub) => sub.payments).sort((a, b) => (b.paidAt ?? '').localeCompare(a.paidAt ?? '')),
    [subscriptions],
  );

  // Rows only expand when there are refund details to show; fully final payments have none
  const table = useTable({
    data,
    columns,
    getRowCanExpand: (row) => getPaymentRefundStatus(row.original) !== 'final',
  });

  return (
    <Card header={<CardTitle title={t('account.billing.title')} />} className="p-0">
      <Table
        table={table}
        loading={isLoading}
        error={null}
        emptyChildren={t('account.billing.no_payments')}
        renderSubComponent={(row) => <PaymentDetailsRow payment={row.original} />}
        expandOnRowClick
        className="border-none"
      />
    </Card>
  );
};

export default BillingSection;
