import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import type { Table } from '@tanstack/react-table';
import Button from 'components/common/Button';
import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';

interface Props<T> {
  table: Table<T>;
  className?: string;
}

const TablePagination = <T,>({ table, className }: Props<T>) => {
  const t = useTranslations();

  const canPreviousPage = table.getCanPreviousPage();
  const canNextPage = table.getCanNextPage();
  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount();
  const pageSize = table.getState().pagination.pageSize;
  const totalRows = table.getFilteredRowModel().rows.length;

  const pageSizeOptions = [10, 25, 50, 100];

  return (
    <div className={twMerge('flex items-center justify-between px-4 py-3', className)}>
      <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
        <span>
          {t.rich('common.pagination.showing', {
            start: pageIndex * pageSize + 1,
            end: Math.min((pageIndex + 1) * pageSize, totalRows),
            total: totalRows,
          })}
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Page Size Selector */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">Show:</span>
          <select
            value={pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="px-2 py-1 text-sm border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-black dark:focus:outline-white"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center gap-1">
          <Button
            style="tertiary"
            size="sm"
            onClick={() => table.setPageIndex(0)}
            disabled={!canPreviousPage}
            aria-label="First page"
          >
            {t('common.pagination.first')}
          </Button>

          <Button
            style="tertiary"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!canPreviousPage}
            aria-label="Previous page"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </Button>

          <span className="flex items-center gap-1 px-3 py-1 text-sm text-zinc-600 dark:text-zinc-400 font-monosans">
            {t.rich('common.pagination.page', { page: pageIndex + 1, total: pageCount })}
          </span>

          <Button
            style="tertiary"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!canNextPage}
            aria-label="Next page"
          >
            <ChevronRightIcon className="w-4 h-4" />
          </Button>

          <Button
            style="tertiary"
            size="sm"
            onClick={() => table.setPageIndex(pageCount - 1)}
            disabled={!canNextPage}
            aria-label="Last page"
          >
            {t('common.pagination.last')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TablePagination;
