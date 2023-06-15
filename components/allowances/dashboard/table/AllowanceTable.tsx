import { Table } from '@tanstack/react-table';
import Error from 'components/common/Error';
import Loader from 'components/common/Loader';
import type { AllowanceData } from 'lib/interfaces';
import { twMerge } from 'tailwind-merge';
import AllowanceTableBody from './AllowanceTableBody';
import AllowanceTableHeader from './AllowanceTableHeader';
import NoAllowancesFound from './NoAllowancesFound';

interface Props {
  loading: boolean;
  loadingMessage?: string;
  table: Table<AllowanceData>;
  error?: Error;
  allowances?: AllowanceData[];
}

const AllowanceTable = ({ loading, loadingMessage, error, table, allowances }: Props) => {
  const classes = {
    loader: 'allowances-loader h-screen',
    container: 'border border-black dark:border-white rounded-lg overflow-x-scroll whitespace-nowrap scrollbar-hide',
    table: 'w-full border-collapse allowances-table',
    label: twMerge('flex flex-col justify-center items-center p-3 gap-2 w-full h-10', !loading && 'empty:hidden'),
  };

  if (!allowances && !loading && !error) return null;

  return (
    <Loader isLoading={loading} loadingMessage={loadingMessage} className={classes.loader}>
      <div className={classes.container}>
        <table className={classes.table}>
          <AllowanceTableHeader table={table} />
          {!loading && !error && <AllowanceTableBody table={table} />}
        </table>
        <div className={classes.label}>
          {!loading && !error && table.getRowModel().rows.length === 0 && <NoAllowancesFound allowances={allowances} />}
          {error && <Error error={error} />}
        </div>
      </div>
    </Loader>
  );
};

export default AllowanceTable;
