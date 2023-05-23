import { Table } from '@tanstack/react-table';
import Error from 'components/common/Error';
import type { AllowanceData } from 'lib/interfaces';
import useTranslation from 'next-translate/useTranslation';
import AllowanceTableBody from './AllowanceTableBody';
import AllowanceTableHeader from './AllowanceTableHeader';
import AllowancesLoading from './AllowancesLoading';
import NoAllowancesFound from './NoAllowancesFound';

interface Props {
  loading: boolean;
  loadingMessage?: string;
  table: Table<AllowanceData>;
  error?: Error;
  allowances?: AllowanceData[];
}

const AllowanceTable = ({ loading, loadingMessage, error, table, allowances }: Props) => {
  const { t } = useTranslation();

  if (!allowances && !loading && !error) return null;

  return (
    <div className="border border-black dark:border-white rounded-lg overflow-x-scroll whitespace-nowrap scrollbar-hide">
      <table className="w-full border-collapse allowances-table">
        <AllowanceTableHeader table={table} />
        {!loading && !error && <AllowanceTableBody table={table} />}
      </table>
      <div className="flex flex-col justify-center items-center p-3 gap-2 w-full empty:hidden">
        {!loading && !error && table.getRowModel().rows.length === 0 && <NoAllowancesFound allowances={allowances} />}
        {error && <Error error={error} />}
        {loading && !error && <AllowancesLoading loadingMessage={loadingMessage} />}
      </div>
    </div>
  );
};

export default AllowanceTable;
