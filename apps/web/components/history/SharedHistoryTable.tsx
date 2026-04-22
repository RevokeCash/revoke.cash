'use client';

import type { ApprovalTokenEvent, Enriched } from '@revoke.cash/core/events';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import Card, { CardTitle } from 'components/common/Card';
import Table from 'components/common/table/Table';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo, useRef } from 'react';
import { ColumnId, columns, customFilterFns } from './columns';
import HistorySearchBox, { type HistorySearchBoxRef } from './HistorySearchBox';
import TablePagination from './TablePagination';

interface Props {
  approvalHistory?: Enriched<ApprovalTokenEvent>[];
  isLoading: boolean;
  error?: Error;
  isPremium?: boolean;
}

const SharedHistoryTable = ({ approvalHistory, isLoading, error, isPremium = false }: Props) => {
  const t = useTranslations();
  const searchBoxRef = useRef<HistorySearchBoxRef>(null);

  const data = useMemo(() => {
    return approvalHistory ?? [];
  }, [approvalHistory]);

  const onFilter = useCallback((filterValue: string) => {
    if (searchBoxRef.current) {
      searchBoxRef.current.setInputValue(filterValue);
    }
  }, []);

  const table = useReactTable({
    data,
    columns,
    autoResetPageIndex: !isPremium,
    getCoreRowModel: getCoreRowModel<Enriched<ApprovalTokenEvent>>(),
    getSortedRowModel: getSortedRowModel<Enriched<ApprovalTokenEvent>>(),
    getFilteredRowModel: getFilteredRowModel<Enriched<ApprovalTokenEvent>>(),
    getPaginationRowModel: getPaginationRowModel<Enriched<ApprovalTokenEvent>>(),
    filterFns: customFilterFns,
    initialState: {
      pagination: {
        pageSize: 25,
      },
      columnVisibility: {
        [ColumnId.CHAIN]: isPremium,
        [ColumnId.COMBINED_SEARCH]: false,
      },
    },
    getRowId(row) {
      return `${row.chainId}-${row.rawLog.transactionHash}-${row.rawLog.logIndex}`;
    },
    meta: { onFilter } as any,
  });

  return (
    <Card header={<CardTitle title={t('address.history.title')} />} className="p-0">
      <HistorySearchBox ref={searchBoxRef} table={table} isPremium={isPremium} />
      <TablePagination table={table} className="border-y border-zinc-200 dark:border-zinc-700" />
      <Table
        table={table}
        loading={isLoading}
        error={error}
        emptyChildren={t('address.history.none_found')}
        loaderRows={table.getState().pagination.pageSize}
        partialLoadingRows={isPremium ? 3 : 0}
        className="border-none rounded-none"
      />
      <TablePagination table={table} className="border-t border-zinc-200 dark:border-zinc-700" />
    </Card>
  );
};

export default SharedHistoryTable;
