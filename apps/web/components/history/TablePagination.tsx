import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import type { Table } from '@tanstack/react-table';
import Button from 'components/common/Button';
import RichText from 'components/common/RichText';
import Select from 'components/common/select/Select';
import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';

interface Props<T> {
  table: Table<T>;
  className?: string;
}

// Tables at or below this size don't benefit from pagination, so the bar is hidden for them
const PAGINATION_ROW_THRESHOLD = 20;

const TablePagination = <T,>({ table, className }: Props<T>) => {
  const t = useTranslations();

  const canPreviousPage = table.getCanPreviousPage();
  const canNextPage = table.getCanNextPage();
  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount();
  const pageSize = table.getState().pagination.pageSize;
  const totalRows = table.getRowCount();

  if (totalRows <= PAGINATION_ROW_THRESHOLD && pageCount <= 1) return null;

  const pageSizeOptions = [10, 25, 50, 100].map((size) => ({ value: String(size) }));

  return (
    <div className={twMerge('flex flex-wrap items-center justify-between gap-3 px-4 py-3', className)}>
      <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
        <span>
          <RichText>
            {(tags) =>
              t.rich('common.pagination.showing', {
                ...tags,
                start: pageIndex * pageSize + 1,
                end: Math.min((pageIndex + 1) * pageSize, totalRows),
                total: totalRows,
              })
            }
          </RichText>
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">{t('common.pagination.show')}</span>
          <Select
            aria-label="Select Page Size"
            size="sm"
            value={{ value: String(pageSize) }}
            options={pageSizeOptions}
            onChange={(option) => table.setPageSize(Number(option.value))}
          />
        </div>

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

          <span className="flex items-center gap-1 px-3 py-1 text-sm text-zinc-600 dark:text-zinc-400 font-monosans whitespace-nowrap">
            <RichText>
              {(tags) => t.rich('common.pagination.page', { ...tags, page: pageIndex + 1, total: pageCount })}
            </RichText>
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
