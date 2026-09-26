'use client';

import { AUTO_REVOKE_SUPPORTED_CHAINS } from '@revoke.cash/core/auto-revoke/config';
import Card, { CardTitle } from 'components/common/Card';
import SegmentedControl from 'components/common/SegmentedControl';
import ChainMultiSelect from 'components/common/select/ChainMultiSelect';
import Table from 'components/common/table/Table';
import { type ActivityScope, useAutoRevokeActivity } from 'lib/hooks/auto-revoke/useAutoRevokeActivity';
import { useAddressAutoRevokeBudget, useSubscriptionAutoRevokeBudget } from 'lib/hooks/auto-revoke/useAutoRevokeBudget';
import { useTable } from 'lib/hooks/useTable';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import type { ActivityStatusKey } from './AutoRevokeActivityStatusBadge';
import AutoRevokeActivityStatusMultiSelect from './AutoRevokeActivityStatusMultiSelect';
import AutoRevokeBudgetSummary from './AutoRevokeBudgetSummary';
import { ColumnId, columns } from './columns';

interface Props {
  subscriptionId?: string;
  addressCount?: number;
  isPreview?: boolean;
}

type ScopeType = ActivityScope['type'];

const AutoRevokeActivitySection = ({ subscriptionId, addressCount, isPreview = false }: Props) => {
  const t = useTranslations();
  const [scopeType, setScopeType] = useState<ScopeType>('address');

  // With a single wallet in the subscription, "all members" is the same as "your activity"
  const showScopeToggle = Boolean(subscriptionId) && (addressCount ?? 0) > 1;
  const scope: ActivityScope =
    scopeType === 'subscription' && subscriptionId ? { type: 'subscription', subscriptionId } : { type: 'address' };

  const { items, isLoading, error } = useAutoRevokeActivity(scope, true);

  const { budget: addressBudget } = useAddressAutoRevokeBudget(scope.type === 'address');
  const { budget: subscriptionBudget } = useSubscriptionAutoRevokeBudget(subscriptionId, scope.type === 'subscription');
  const budget = scope.type === 'subscription' ? subscriptionBudget : addressBudget;

  const table = useTable({
    data: items,
    columns,
    getRowId: (row) => row.id,
    columnVisibility: { [ColumnId.WALLET]: scope.type === 'subscription' },
    pageSize: 10,
  });

  // The table owns the filter state; the selects read and write the filter value of their column
  const statusColumn = table.getColumn(ColumnId.STATUS)!;
  const chainColumn = table.getColumn(ColumnId.CHAIN)!;
  const selectedStatusKeys = (statusColumn.getFilterValue() as ActivityStatusKey[] | undefined) ?? [];
  const selectedChainIds = (chainColumn.getFilterValue() as number[] | undefined) ?? [];
  const hasActiveFilters = table.state.columnFilters.length > 0;

  const emptyMessageKey = hasActiveFilters ? 'empty_filtered' : isPreview ? 'empty_preview' : 'empty';

  return (
    <Card header={<CardTitle title={t('account.auto_revoke.activity.title')} />} className="p-0">
      <div className="flex flex-col-reverse gap-3 p-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 dark:border-zinc-700">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          {showScopeToggle && (
            <SegmentedControl
              options={[
                { value: 'address', label: t('account.auto_revoke.activity.scope.mine') },
                { value: 'subscription', label: t('account.auto_revoke.activity.scope.subscription') },
              ]}
              value={scopeType}
              onChange={setScopeType}
            />
          )}
          <AutoRevokeActivityStatusMultiSelect
            selectedStatusKeys={selectedStatusKeys}
            onChange={(statusKeys) => statusColumn.setFilterValue(statusKeys)}
            className="w-full sm:w-44 shrink-0"
          />
          <ChainMultiSelect
            instanceId="auto-revoke-activity-chain-multi-select"
            aria-label={t('account.auto_revoke.activity.columns.chain')}
            chainIds={AUTO_REVOKE_SUPPORTED_CHAINS}
            selectedChainIds={selectedChainIds}
            onChange={(chainIds) => chainColumn.setFilterValue(chainIds)}
            className="w-full sm:w-40 shrink-0"
          />
        </div>
        {budget && (
          <div className="sm:ml-auto">
            <AutoRevokeBudgetSummary budget={budget} />
          </div>
        )}
      </div>
      <Table
        table={table}
        loading={isLoading}
        error={error}
        emptyChildren={t(`account.auto_revoke.activity.${emptyMessageKey}`)}
        className="border-none rounded-none"
      />
    </Card>
  );
};

export default AutoRevokeActivitySection;
