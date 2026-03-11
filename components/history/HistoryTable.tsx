import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import Card from 'components/common/Card';
import Table from 'components/common/table/Table';
import { useApprovalHistory } from 'lib/hooks/ethereum/useApprovalHistory';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo, useRef } from 'react';
import { ColumnId, columns, customFilterFns } from './columns';
import HistorySearchBox, { type HistorySearchBoxRef } from './HistorySearchBox';
import TablePagination from './TablePagination';
import type { ApprovalHistoryEvent } from './utils';

const HistoryTable = () => {
  const t = useTranslations();
  const { approvalHistory, isLoading, error } = useApprovalHistory();
  const searchBoxRef = useRef<HistorySearchBoxRef>(null);

  // We fall back to an empty array because the table crashes if the data is undefined
  // and we use useMemo to prevent the table from infinite re-rendering
  const data = useMemo(() => {
    return approvalHistory ?? [];
  }, [approvalHistory]);

  const onFilter = useCallback((filterValue: string) => {
    // Set the filter value in the search box
    if (searchBoxRef.current) {
      searchBoxRef.current.setInputValue(filterValue);
    }
  }, []);

  const title = (
    <div className="flex items-center gap-2">
      <div>{t('address.history.title')}</div>
    </div>
  );

  const table = useReactTable({
    data,
    columns,
    debugTable: true,
    getCoreRowModel: getCoreRowModel<ApprovalHistoryEvent>(),
    getSortedRowModel: getSortedRowModel<ApprovalHistoryEvent>(),
    getFilteredRowModel: getFilteredRowModel<ApprovalHistoryEvent>(),
    getPaginationRowModel: getPaginationRowModel<ApprovalHistoryEvent>(),
    filterFns: customFilterFns,
    initialState: {
      pagination: {
        pageSize: 25,
      },
      columnVisibility: {
        [ColumnId.COMBINED_SEARCH]: false,
      },
    },
    getRowId(row, index) {
      return `${row.time.transactionHash}-${index}`;
    },
    meta: { onFilter } as any,
  });

  return (
    <Card title={title} className="p-0 overflow-x-scroll whitespace-nowrap scrollbar-hide">
      <div className="flex flex-col gap-2 p-4">
        <HistorySearchBox ref={searchBoxRef} table={table} />
      </div>
      <TablePagination table={table} className="border-y border-zinc-200 dark:border-zinc-700" />
      <Table
        table={table}
        loading={isLoading}
        error={error}
        emptyChildren={t('address.history.none_found')}
        loaderRows={table.getState().pagination.pageSize}
        className="border-none"
      />
      <TablePagination table={table} className="border-t border-zinc-200 dark:border-zinc-700" />
    </Card>
  );
};

export default HistoryTable;
