'use client';

import type { PremiumSubscription, SubscriptionPayment } from '@revoke.cash/core/premium/types';
import { getCoreRowModel, getPaginationRowModel, useReactTable } from '@tanstack/react-table';
import Card, { CardTitle } from 'components/common/Card';
import Table from 'components/common/table/Table';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { columns } from './columns';

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

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel<SubscriptionPayment>(),
    getPaginationRowModel: getPaginationRowModel<SubscriptionPayment>(),
    initialState: {
      pagination: {
        pageSize: 25,
      },
    },
  });

  return (
    <Card header={<CardTitle title={t('account.billing.title')} />} className="p-0">
      <Table
        table={table}
        loading={isLoading}
        error={null}
        emptyChildren={t('account.billing.no_payments')}
        loaderRows={3}
        className="border-none"
      />
    </Card>
  );
};

export default BillingSection;
