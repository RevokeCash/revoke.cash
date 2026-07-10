import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import type { Nullable } from '@revoke.cash/core/types';
import { isNullish } from '@revoke.cash/core/utils';
import type { Table as ReactTable } from '@tanstack/react-table';
import EmptyState from 'components/common/EmptyState';
import ErrorDisplay from 'components/common/ErrorDisplay';
import TablePagination from 'components/history/TablePagination';
import { twMerge } from 'tailwind-merge';
import TableBody from './TableBody';
import TableFooter from './TableFooter';
import TableHeader from './TableHeader';

interface Props<T> {
  loading: boolean;
  table: ReactTable<T>;
  error?: Nullable<Error>;
  emptyChildren?: React.ReactNode;
  loaderRows?: number;
  partialLoadingRows?: number;
  className?: string;
}

const Table = <T,>({ loading, error, table, emptyChildren, loaderRows, partialLoadingRows, className }: Props<T>) => {
  const classes = {
    container:
      'border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-x-scroll whitespace-nowrap scrollbar-hide',
    table: 'w-full border-collapse allowances-table',
    label: 'flex flex-col justify-center items-center w-full empty:hidden',
  };

  return (
    <>
      <TablePagination table={table} className="border-b border-zinc-200 dark:border-zinc-700" />
      <div className={twMerge(classes.container, className)}>
        <table className={classes.table}>
          <TableHeader table={table} />
          <TableFooter table={table} />
          {!error && (
            <TableBody
              table={table}
              isLoading={loading}
              loaderRows={loaderRows}
              partialLoadingRows={partialLoadingRows}
            />
          )}
        </table>
        <div className={classes.label}>
          {!loading && !error && table?.getRowModel()?.rows?.length === 0 && !isNullish(emptyChildren) && (
            <EmptyState>{emptyChildren}</EmptyState>
          )}
          {!loading && error && (
            <EmptyState icon={ExclamationTriangleIcon} iconClassName="text-red-500 dark:text-red-400">
              <ErrorDisplay error={error} withIcon={false} />
            </EmptyState>
          )}
        </div>
      </div>
      <TablePagination table={table} className="border-t border-zinc-200 dark:border-zinc-700" />
    </>
  );
};

export default Table;
