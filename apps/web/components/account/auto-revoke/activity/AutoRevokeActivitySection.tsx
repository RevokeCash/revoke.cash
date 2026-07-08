'use client';

import type { AutoRevokeActivityItem } from '@revoke.cash/core/auto-revoke/activity';
import { getCoreRowModel, getPaginationRowModel, useReactTable } from '@tanstack/react-table';
import Card, { CardTitle } from 'components/common/Card';
import SegmentedControl from 'components/common/SegmentedControl';
import Table from 'components/common/table/Table';
import { type ActivityScope, useAutoRevokeActivity } from 'lib/hooks/auto-revoke/useAutoRevokeActivity';
import { useAutoRevokeBudget } from 'lib/hooks/auto-revoke/useAutoRevokeBudget';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import AutoRevokeBudgetSummary from './AutoRevokeBudgetSummary';
import { ColumnId, columns } from './columns';

interface Props {
  subscriptionId?: string;
}

type ScopeType = ActivityScope['type'];

const AutoRevokeActivitySection = ({ subscriptionId }: Props) => {
  const t = useTranslations();
  const [scopeType, setScopeType] = useState<ScopeType>('address');

  const isOwner = Boolean(subscriptionId);
  const scope: ActivityScope =
    scopeType === 'subscription' && subscriptionId ? { type: 'subscription', subscriptionId } : { type: 'address' };

  const { items, isLoading, error } = useAutoRevokeActivity(scope, true);
  const { budget } = useAutoRevokeBudget(subscriptionId, isOwner);

  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel<AutoRevokeActivityItem>(),
    getPaginationRowModel: getPaginationRowModel<AutoRevokeActivityItem>(),
    getRowId: (row) => row.id,
    initialState: {
      pagination: { pageSize: 25 },
    },
    state: {
      columnVisibility: { [ColumnId.WALLET]: scope.type === 'subscription' },
    },
  });

  return (
    <Card header={<CardTitle title={t('account.auto_revoke.activity.title')} />} className="p-0">
      {(isOwner || budget) && (
        <div className="flex flex-col-reverse gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          {isOwner && (
            <SegmentedControl
              options={[
                { value: 'address', label: t('account.auto_revoke.activity.scope.mine') },
                { value: 'subscription', label: t('account.auto_revoke.activity.scope.subscription') },
              ]}
              value={scopeType}
              onChange={setScopeType}
            />
          )}
          {budget && <AutoRevokeBudgetSummary budget={budget} />}
        </div>
      )}
      <Table
        table={table}
        loading={isLoading}
        error={error}
        loaderRows={5}
        emptyChildren={t('account.auto_revoke.activity.empty')}
        className="border-none rounded-none"
      />
    </Card>
  );
};

export default AutoRevokeActivitySection;
