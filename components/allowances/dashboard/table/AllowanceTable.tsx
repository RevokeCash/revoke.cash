import { Table } from '@tanstack/react-table';
import Error from 'components/common/Error';
import type { AllowanceData } from 'lib/interfaces';
import AllowanceTableBody from './AllowanceTableBody';
import AllowanceTableHeader from './AllowanceTableHeader';
import NoAllowancesFound from './NoAllowancesFound';

interface Props {
  loading: boolean;
  table: Table<AllowanceData>;
  error?: Error;
  allowances?: AllowanceData[];
}

const AllowanceTable = ({ loading, error, table, allowances }: Props) => {
  const classes = {
    container: 'border border-black dark:border-white rounded-lg overflow-x-scroll whitespace-nowrap scrollbar-hide',
    table: 'w-full border-collapse allowances-table',
    label: 'flex flex-col justify-center items-center p-3 gap-2 w-full h-10 empty:hidden',
  };

  if (!allowances && !loading && !error) return null;

  return (
    <div className={classes.container}>
      <table className={classes.table}>
        <AllowanceTableHeader table={table} />
        {!error && <AllowanceTableBody table={table} isLoading={loading} />}
      </table>
      <div className={classes.label}>
        {!loading && !error && table.getRowModel().rows.length === 0 && <NoAllowancesFound allowances={allowances} />}
        {!loading && error && <Error error={error} />}
      </div>
    </div>
  );
};

export default AllowanceTable;
