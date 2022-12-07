import { Table } from '@tanstack/react-table';
import type { AllowanceData } from 'lib/interfaces';
import FilterSelect from './FilterSelect';
import SortSelect from './SortSelect';

interface Props {
  table: Table<AllowanceData>;
}

const AllowanceTableHeader = ({ table }: Props) => {
  return (
    <div className="flex justify-start gap-2">
      <SortSelect table={table} />
      <FilterSelect table={table} />
    </div>
  );
};

export default AllowanceTableHeader;
