'use client';

import type { AdminSubscriptionFilter } from '@revoke.cash/core/admin/subscriptions';
import { getCoreRowModel, type PaginationState, useReactTable } from '@tanstack/react-table';
import Card, { CardTitle } from 'components/common/Card';
import Input from 'components/common/Input';
import SegmentedControl from 'components/common/SegmentedControl';
import Table from 'components/common/table/Table';
import { useAdminSubscriptions } from 'lib/hooks/admin/useAdminSubscriptions';
import { useState } from 'react';
import { getAddress, isAddress } from 'viem';
import { columns } from './columns';

const FILTER_OPTIONS: Array<{ value: AdminSubscriptionFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'expiring', label: 'Expiring' },
  { value: 'expired', label: 'Expired' },
  { value: 'anomaly', label: 'Anomaly' },
];

const SubscriptionsTable = () => {
  const [filter, setFilter] = useState<AdminSubscriptionFilter>('all');
  const [ownerInput, setOwnerInput] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 });

  const trimmedOwnerInput = ownerInput.trim();
  const ownerAddress = isAddress(trimmedOwnerInput, { strict: false }) ? getAddress(trimmedOwnerInput) : undefined;
  const hasInvalidOwnerInput = trimmedOwnerInput.length > 0 && !ownerAddress;

  const { data, isLoading, error } = useAdminSubscriptions({
    filter,
    ownerAddress,
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
  });

  const table = useReactTable({
    data: data?.items ?? [],
    columns: columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    manualPagination: true,
    rowCount: data?.totalCount ?? 0,
    state: { pagination },
    onPaginationChange: setPagination,
  });

  const resetToFirstPage = () => setPagination((current) => ({ ...current, pageIndex: 0 }));

  const changeFilter = (newFilter: AdminSubscriptionFilter) => {
    setFilter(newFilter);
    resetToFirstPage();
  };

  const changeOwnerInput = (newOwnerInput: string) => {
    setOwnerInput(newOwnerInput);
    resetToFirstPage();
  };

  return (
    <Card
      header={<CardTitle title="Subscriptions" subtitle="All premium subscriptions, newest first" />}
      className="p-0"
    >
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 dark:border-zinc-700">
        <SegmentedControl options={FILTER_OPTIONS} value={filter} onChange={changeFilter} />
        <div className="flex flex-col gap-1 sm:w-96">
          <Input
            size="md"
            placeholder="Filter by owner address"
            value={ownerInput}
            onChange={(event) => changeOwnerInput(event.target.value)}
            className="w-full font-mono text-sm"
            aria-label="Filter by owner address"
          />
          {hasInvalidOwnerInput && <span className="text-xs text-red-500">Not a valid address</span>}
        </div>
      </div>
      <Table
        table={table}
        loading={isLoading}
        error={error}
        emptyChildren="No subscriptions match this filter"
        loaderRows={10}
        className="border-none"
      />
    </Card>
  );
};

export default SubscriptionsTable;
