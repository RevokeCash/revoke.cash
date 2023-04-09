import { Table } from '@tanstack/react-table';
import type { AllowanceData } from 'lib/interfaces';
import AllowanceSearch from './AllowanceSearch';
import FilterSelect from './FilterSelect';
import SortSelect from './SortSelect';

interface Props {
  table: Table<AllowanceData>;
  filterByContract: (contract: string | null) => void;
}

const AllowanceTableHeader = ({ table, filterByContract }: Props) => {
  return (
    <div className="flex justify-start gap-2 flex-col md:flex-row">
      <SortSelect table={table} />
      <FilterSelect table={table} />
      <AllowanceSearch filterByContract={filterByContract} />
    </div>
  );
};

export default AllowanceTableHeader;
