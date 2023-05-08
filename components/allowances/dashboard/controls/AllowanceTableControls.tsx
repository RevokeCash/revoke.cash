import { Table } from '@tanstack/react-table';
import type { AllowanceData } from 'lib/interfaces';
import AllowanceSearchBox from './AllowanceSearchBox';
import FilterSelect from './FilterSelect';
import SortSelect from './SortSelect';

interface Props {
  table: Table<AllowanceData>;
}

const AllowanceTableControls = ({ table }: Props) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-start gap-2 flex-col">
        <SortSelect table={table} />
        <FilterSelect table={table} />
      </div>
      <AllowanceSearchBox table={table} />
    </div>
  );
};

export default AllowanceTableControls;
