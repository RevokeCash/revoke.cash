'use client';

import type { AuditAction } from '@revoke.cash/core/audit/actions';
import { getCoreRowModel, getExpandedRowModel, type PaginationState, useReactTable } from '@tanstack/react-table';
import Card, { CardTitle } from 'components/common/Card';
import Table from 'components/common/table/Table';
import { useAdminAudit } from 'lib/hooks/admin/useAdminAudit';
import { useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { type Address, isAddress } from 'viem';
import AuditDetailsRow from './AuditDetailsRow';
import AuditFilterBar from './AuditFilterBar';
import { columns } from './columns';

interface AuditTableScope {
  address?: Address;
  subscriptionId?: string;
}

export interface AuditTableInitialFilters {
  actions?: AuditAction[];
  address?: Address;
}

interface Props {
  scope?: AuditTableScope;
  title: string;
  subtitle?: string;
  initialFilters?: AuditTableInitialFilters;
}

const AuditTable = ({ scope, title, subtitle, initialFilters }: Props) => {
  const [selectedActions, setSelectedActions] = useState<AuditAction[]>(initialFilters?.actions ?? []);
  const [addressInput, setAddressInput] = useState<string>(initialFilters?.address ?? '');
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 });

  const trimmedAddress = addressInput.trim();
  const addressFilter = isAddress(trimmedAddress, { strict: false }) ? trimmedAddress : undefined;

  // Scope values apply to every query and cannot be overridden by the filter bar
  const { data, isLoading, isPlaceholderData, error } = useAdminAudit({
    address: scope ? scope.address : addressFilter,
    subscriptionId: scope?.subscriptionId,
    actions: selectedActions,
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

  const updateSelectedActions = (actions: AuditAction[]) => {
    setSelectedActions(actions);
    resetToFirstPage();
  };

  const updateAddressInput = (value: string) => {
    setAddressInput(value);
    resetToFirstPage();
  };

  return (
    <Card header={<CardTitle title={title} subtitle={subtitle} />} className="p-0">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
        <AuditFilterBar
          selectedActions={selectedActions}
          addressInput={addressInput}
          showAddressFilter={scope === undefined}
          onActionsChange={updateSelectedActions}
          onAddressChange={updateAddressInput}
        />
      </div>
      <Table
        table={table}
        loading={isLoading}
        error={error}
        emptyChildren="No audit events match the current filters"
        loaderRows={10}
        renderSubComponent={(row) => <AuditDetailsRow item={row.original} />}
        className={twMerge('border-none', isPlaceholderData && 'opacity-60')}
      />
    </Card>
  );
};

export default AuditTable;
