import type { Table as ReactTable } from '@tanstack/react-table';
import Error from 'components/common/Error';
import { Nullable } from 'lib/interfaces';
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
  className?: string;
}

const Table = <T,>({ loading, error, table, emptyChildren, loaderRows, className }: Props<T>) => {
  const classes = {
    container: 'border border-black dark:border-white rounded-lg overflow-x-scroll whitespace-nowrap scrollbar-hide',
    table: 'w-full border-collapse allowances-table',
    label: 'flex flex-col justify-center items-center p-3 gap-2 w-full h-10 empty:hidden',
  };

  return (
    <div className={twMerge(classes.container, className)}>
      <table className={classes.table}>
        <TableHeader table={table} />
        <TableFooter table={table} />
        {!error && <TableBody table={table} isLoading={loading} loaderRows={loaderRows} />}
      </table>
      <div className={classes.label}>
        {!loading && !error && table?.getRowModel()?.rows?.length === 0 && emptyChildren}
        {!loading && error && <Error error={error} />}
      </div>
    </div>
  );
};

export default Table;
