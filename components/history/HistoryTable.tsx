import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import Card from 'components/common/Card';
import Table from 'components/common/table/Table';
import { useApprovalHistory } from 'lib/hooks/ethereum/useApprovalHistory';
import type { ApprovalTokenEvent } from 'lib/utils/events';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo, useRef } from 'react';
import HistorySearchBox, { type HistorySearchBoxRef } from './HistorySearchBox';
import { createColumns, customFilterFns } from './columns';

const HistoryTable = () => {
  const t = useTranslations();
  const { approvalHistory, isLoading, error } = useApprovalHistory();
  const searchBoxRef = useRef<HistorySearchBoxRef>(null);

  const data = useMemo(() => approvalHistory ?? [], [approvalHistory]);

  const handleFilter = useCallback((filterValue: string) => {
    // Set the filter value in the search box
    if (searchBoxRef.current) {
      searchBoxRef.current.setSearchValue(filterValue);
    }
  }, []);

  const title = (
    <div className="flex items-center gap-2">
      <div>{t('address.history.title')}</div>
    </div>
  );

  const columns = useMemo(() => createColumns(handleFilter), [handleFilter]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel<ApprovalTokenEvent>(),
    getSortedRowModel: getSortedRowModel<ApprovalTokenEvent>(),
    getFilteredRowModel: getFilteredRowModel<ApprovalTokenEvent>(),
    filterFns: customFilterFns,
    getRowId(row, index) {
      return `${row.time.transactionHash}-${index}`;
    },
  });

  const controls = (
    <div className="flex flex-col gap-2 p-4">
      <HistorySearchBox ref={searchBoxRef} table={table} />
    </div>
  );

  return (
    <Card title={title} className="p-0 overflow-x-scroll whitespace-nowrap scrollbar-hide">
      {controls}
      <Table
        table={table}
        loading={isLoading}
        error={error}
        emptyChildren={t('address.history.none_found')}
        loaderRows={2}
        className="border-none"
      />
    </Card>
  );
};

export default HistoryTable;
