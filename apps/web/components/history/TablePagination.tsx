import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import type { ReactTable, RowData } from '@tanstack/react-table';
import Button from 'components/common/Button';
import RichText from 'components/common/RichText';
import Select from 'components/common/select/Select';
import type { AppTableFeatures } from 'lib/utils/table';
import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';

interface Props<TMeta extends object, T extends RowData> {
  table: ReactTable<AppTableFeatures<TMeta>, T>;
  className?: string;
}

// Tables at or below this size don't benefit from pagination, so the bar is hidden for them
const PAGINATION_ROW_THRESHOLD = 20;

const TablePagination = <TMeta extends object, T extends RowData>({ table, className }: Props<TMeta, T>) => {
  const t = useTranslations();

  const canPreviousPage = table.getCanPreviousPage();
  const canNextPage = table.getCanNextPage();
  const pageIndex = table.state.pagination.pageIndex;
  const pageCount = Math.max(table.getPageCount(), 1);
  const pageSize = table.state.pagination.pageSize;
  const totalRows = table.getRowCount();
  const firstRowOnPage = Math.min(pageIndex * pageSize + 1, totalRows);
  const lastRowOnPage = Math.min((pageIndex + 1) * pageSize, totalRows);

  const unfilteredRowCount = table.getPreFilteredRowModel().rows.length;
  if (unfilteredRowCount <= PAGINATION_ROW_THRESHOLD && pageCount <= 1) return null;

  const pageSizeOptions = [10, 25, 50, 100].map((size) => ({ value: String(size) }));

  return (
    <div className={twMerge('flex flex-wrap items-center justify-between gap-3 px-4 py-3', className)}>
      <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
        <span className="max-sm:sr-only">
          <RichText>
            {(tags) =>
              t.rich('common.pagination.showing', {
                ...tags,
                start: firstRowOnPage,
                end: lastRowOnPage,
                total: totalRows,
              })
            }
          </RichText>
        </span>
        {/* Phones show digits, the page size, Previous and Next. The page size label fits on the same row from 375px in every language */}
        <span aria-hidden="true" className="sm:hidden whitespace-nowrap">
          {firstRowOnPage}-{lastRowOnPage} / {totalRows}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="max-[375px]:hidden text-zinc-600 dark:text-zinc-400">{t('common.pagination.show')}</span>
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
            className="max-sm:hidden"
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

          <span className="flex max-sm:hidden items-center gap-1 px-3 py-1 text-sm text-zinc-600 dark:text-zinc-400 font-monosans whitespace-nowrap">
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
            className="max-sm:hidden"
          >
            {t('common.pagination.last')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TablePagination;
