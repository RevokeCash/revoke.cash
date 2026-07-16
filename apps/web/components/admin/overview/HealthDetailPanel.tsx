'use client';

import type { UseQueryResult } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import Table from 'components/common/table/Table';
import { useTable } from 'lib/hooks/useTable';
import { useMemo } from 'react';

interface Props<T> {
  isOpen: boolean;
  query: UseQueryResult<{ rows: T[]; totalCount: number }>;
  columns: ColumnDef<T, any>[];
  getRowId: (row: T) => string;
  emptyChildren: React.ReactNode;
}

// Shared drill-down shell for the health section: a bordered table over the first rows of a capped query
const HealthDetailPanel = <T,>({ isOpen, query, columns, getRowId, emptyChildren }: Props<T>) => {
  const { data, isLoading, error } = query;

  const rows = useMemo(() => data?.rows ?? [], [data]);

  const table = useTable({ data: rows, columns, getRowId });

  if (!isOpen) return null;

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
      <Table table={table} loading={isLoading} error={error} emptyChildren={emptyChildren} className="border-none" />
      {data && data.totalCount > data.rows.length && (
        <p className="mt-2 text-xs text-zinc-500">
          Showing first {data.rows.length} of {data.totalCount}
        </p>
      )}
    </div>
  );
};

export default HealthDetailPanel;
