import type { ColumnSort } from '@tanstack/react-table';
import { type ReactNode, Suspense } from 'react';
import AllowanceSearchBox from './AllowanceSearchBox';
import SortSelect from './SortSelect';

interface Props {
  onSearchValuesChange: (values: string[]) => void;
  onSortChange: (sort: ColumnSort[]) => void;
  children?: ReactNode;
}

const AllowanceTableControls = ({ onSearchValuesChange, onSortChange, children }: Props) => {
  return (
    <div className="flex flex-wrap gap-2">
      <div className="w-full min-w-0 xl:w-auto xl:flex-1">
        <Suspense>
          <AllowanceSearchBox onSearchValuesChange={onSearchValuesChange} />
        </Suspense>
      </div>
      <SortSelect onSortChange={onSortChange} className="sm:w-auto grow xl:grow-0" />
      {children}
    </div>
  );
};

export default AllowanceTableControls;
