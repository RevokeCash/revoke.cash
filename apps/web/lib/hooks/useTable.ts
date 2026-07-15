'use client';

import {
  type ColumnDef,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type Row,
  type TableMeta,
  useReactTable,
  type VisibilityState,
} from '@tanstack/react-table';

interface TableOptions<T> {
  data: T[];
  columns: ColumnDef<T, any>[];
  getRowId?: (row: T) => string;
  getRowCanExpand?: (row: Row<T>) => boolean;
  pageSize?: number;
  columnVisibility?: VisibilityState;
  meta?: TableMeta<T>;
  autoResetPageIndex?: boolean;
}

export const useTable = <T>({
  data,
  columns,
  getRowId,
  getRowCanExpand,
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
    ...(getRowCanExpand ? { getExpandedRowModel: getExpandedRowModel(), getRowCanExpand } : {}),
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
