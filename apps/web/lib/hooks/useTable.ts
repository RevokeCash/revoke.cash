'use client';

import {
  type ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type TableMeta,
  useReactTable,
  type VisibilityState,
} from '@tanstack/react-table';

interface TableOptions<T> {
  data: T[];
  columns: ColumnDef<T, any>[];
  getRowId?: (row: T) => string;
  pageSize?: number;
  columnVisibility?: VisibilityState;
  meta?: TableMeta<T>;
  autoResetPageIndex?: boolean;
}

export const useTable = <T>({
  data,
  columns,
  getRowId,
  pageSize = 25,
  columnVisibility,
  meta,
  autoResetPageIndex,
}: TableOptions<T>) => {
  return useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId,
    meta,
    autoResetPageIndex,
    initialState: {
      pagination: {
        pageSize,
      },
    },
    ...(columnVisibility ? { state: { columnVisibility } } : {}),
  });
};
