'use client';

import type { ActionStatus } from '@revoke.cash/core/auto-revoke/actions';
import { getCoreRowModel, getExpandedRowModel, type PaginationState, useReactTable } from '@tanstack/react-table';
import Card, { CardTitle } from 'components/common/Card';
import Table from 'components/common/table/Table';
import { useAdminActivity } from 'lib/hooks/admin/useAdminActivity';
import { useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { type Address, isAddress } from 'viem';
import ActivityDiagnosticsRow from './ActivityDiagnosticsRow';
import ActivityFilterBar from './ActivityFilterBar';
import { columns } from './columns';

interface ActivityTableScope {
  address?: Address;
  subscriptionId?: string;
}

export interface ActivityTableInitialFilters {
  statuses?: ActionStatus[];
  chainIds?: number[];
  address?: Address;
}

interface Props {
  scope?: ActivityTableScope;
  title: string;
  subtitle?: string;
  initialFilters?: ActivityTableInitialFilters;
}

const ActivityTable = ({ scope, title, subtitle, initialFilters }: Props) => {
  const [selectedStatuses, setSelectedStatuses] = useState<ActionStatus[]>(initialFilters?.statuses ?? []);
  const [selectedChainIds, setSelectedChainIds] = useState<number[]>(initialFilters?.chainIds ?? []);
  const [addressInput, setAddressInput] = useState<string>(initialFilters?.address ?? '');
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 });

  const trimmedAddress = addressInput.trim();
  const addressFilter = isAddress(trimmedAddress, { strict: false }) ? trimmedAddress : undefined;

  // Scope values apply to every query and cannot be overridden by the filter bar
  const { data, isLoading, isPlaceholderData, error } = useAdminActivity({
    address: scope ? scope.address : addressFilter,
    subscriptionId: scope?.subscriptionId,
    chainIds: selectedChainIds,
    statuses: selectedStatuses,
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
  });

  const table = useReactTable({
    data: data?.items ?? [],
    columns: columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowId: (row) => row.id,
    getRowCanExpand: () => true,
    manualPagination: true,
    rowCount: data?.totalCount ?? 0,
    state: { pagination },
    onPaginationChange: setPagination,
  });

  const resetToFirstPage = () => setPagination((current) => ({ ...current, pageIndex: 0 }));

  const updateSelectedStatuses = (statuses: ActionStatus[]) => {
    setSelectedStatuses(statuses);
    resetToFirstPage();
  };

  const updateSelectedChainIds = (chainIds: number[]) => {
    setSelectedChainIds(chainIds);
    resetToFirstPage();
  };

  const updateAddressInput = (value: string) => {
    setAddressInput(value);
    resetToFirstPage();
  };

  return (
    <Card header={<CardTitle title={title} subtitle={subtitle} />} className="p-0">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
        <ActivityFilterBar
          selectedStatuses={selectedStatuses}
          selectedChainIds={selectedChainIds}
          addressInput={addressInput}
          showAddressFilter={scope === undefined}
          onStatusesChange={updateSelectedStatuses}
          onChainIdsChange={updateSelectedChainIds}
          onAddressChange={updateAddressInput}
        />
      </div>
      <Table
        table={table}
        loading={isLoading}
        error={error}
        emptyChildren="No activity matches the current filters"
        loaderRows={10}
        renderSubComponent={(row) => <ActivityDiagnosticsRow item={row.original} />}
        className={twMerge('border-none', isPlaceholderData && 'opacity-60')}
      />
    </Card>
  );
};

export default ActivityTable;
