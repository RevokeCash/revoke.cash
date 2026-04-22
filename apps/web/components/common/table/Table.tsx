import type { Table as ReactTable } from '@tanstack/react-table';
import ErrorDisplay from 'components/common/ErrorDisplay';
import type { Nullable } from 'lib/interfaces';
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
    label: 'flex flex-col justify-center items-center p-3 gap-2 w-full h-12 empty:hidden',
  };

  return (
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
        {!loading && !error && table?.getRowModel()?.rows?.length === 0 && emptyChildren}
        {!loading && error && <ErrorDisplay error={error} />}
      </div>
    </div>
  );
};

export default Table;
