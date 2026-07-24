'use client';

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import type { Nullable } from '@revoke.cash/core/types';
import { isNullish } from '@revoke.cash/core/utils';
import type { Table as ReactTable, Row } from '@tanstack/react-table';
import EmptyState from 'components/common/EmptyState';
import ErrorDisplay from 'components/common/ErrorDisplay';
import ScrollFade from 'components/common/ScrollFade';
import TablePagination from 'components/history/TablePagination';
import { useScrollFades } from 'lib/hooks/useScrollFades';
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
  // Renders a full-width sub-row (e.g. an expanded details <tr>) below rows that are expanded
  renderSubComponent?: (row: Row<T>) => React.ReactNode;
  // Makes expandable rows toggle their expansion when clicked anywhere outside an interactive element
  expandOnRowClick?: boolean;
  className?: string;
}

const Table = <T,>({
  loading,
  error,
  table,
  emptyChildren,
  loaderRows,
  partialLoadingRows,
  renderSubComponent,
  expandOnRowClick,
  className,
}: Props<T>) => {
  const { scrollContainerRef, canScrollLeft, canScrollRight } = useScrollFades<HTMLDivElement>();

  const classes = {
    container: 'relative border border-zinc-200 dark:border-zinc-800 rounded-xl',
    scrollContainer: 'overflow-x-scroll whitespace-nowrap scrollbar-hide',
    table: 'w-full border-collapse allowances-table',
    label: 'flex flex-col justify-center items-center w-full empty:hidden',
  };

  return (
    <>
      <TablePagination table={table} className="border-b border-zinc-200 dark:border-zinc-700" />
      <div className={twMerge(classes.container, className)}>
        <div ref={scrollContainerRef} className={classes.scrollContainer}>
          <table className={classes.table}>
            <TableHeader table={table} />
            <TableFooter table={table} />
            {!error && (
              <TableBody
                table={table}
                isLoading={loading}
                loaderRows={loaderRows}
                partialLoadingRows={partialLoadingRows}
                renderSubComponent={renderSubComponent}
                expandOnRowClick={expandOnRowClick}
              />
            )}
          </table>
        </div>
        <ScrollFade side="left" visible={canScrollLeft} className="rounded-l-xl" />
        <ScrollFade side="right" visible={canScrollRight} className="rounded-r-xl" />
        <div className={classes.label}>
          {!loading && !error && table?.getRowModel()?.rows?.length === 0 && !isNullish(emptyChildren) && (
            <EmptyState>{emptyChildren}</EmptyState>
          )}
          {!loading && error && (
            <EmptyState icon={ExclamationTriangleIcon} iconClassName="text-red-500 dark:text-red-400">
              <ErrorDisplay error={error} withIcon={false} className="whitespace-normal" />
            </EmptyState>
          )}
        </div>
      </div>
      <TablePagination table={table} className="border-t border-zinc-200 dark:border-zinc-700" />
    </>
  );
};

export default Table;
