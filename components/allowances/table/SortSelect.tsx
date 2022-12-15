import { Column, sortingFns, Table } from '@tanstack/react-table';
import Select from 'components/common/select/Select';
import { AllowanceData } from 'lib/interfaces';
import { useMemo } from 'react';
import { ColumnId, customSortingFns } from './columns';

interface Option {
  id: ColumnId;
  value: string;
  column: Column<AllowanceData>;
  desc: boolean;
}

interface Props {
  table: Table<AllowanceData>;
}

// TODO: Translations for sorting
const SortSelect = ({ table }: Props) => {
  const options = useMemo(() => {
    return table
      .getAllColumns()
      .filter((column) => column.getCanSort())
      .flatMap((column) => [
        { value: `${column.id}-false`, id: column.id, column, desc: false },
        { value: `${column.id}-true`, id: column.id, column, desc: true },
      ]);
  }, [table]);

  const onChange = ({ id, desc }: Option) => {
    table.setSorting(() => [{ id, desc }]);
  };

  const displayOption = ({ column, desc }: Option) => {
    const sortingFnDisplays = {
      [sortingFns.basic.name]: {
        desc: 'High > Low',
        asc: 'Low > High',
      },
      [sortingFns.text.name]: {
        desc: 'Z > A',
        asc: 'A > Z',
      },
      [customSortingFns.timestamp.name]: {
        desc: 'Newest > Oldest',
        asc: 'Oldest > Newest',
      },
      [customSortingFns.allowance.name]: {
        desc: 'High > Low',
        asc: 'Low > High',
      },
    };

    const sortingFnDisplay = sortingFnDisplays[column.getSortingFn().name]?.[desc ? 'desc' : 'asc'];

    return (
      <div className="flex items-center gap-1">
        {column.id}: {sortingFnDisplay}
      </div>
    );
  };

  return (
    <Select
      instanceId="sort-select"
      className="h-full w-72 shrink-0"
      classNamePrefix="sort-select"
      value={options.find((option) => {
        const [sorting] = table.getState().sorting;
        return option.id === sorting.id && option.desc === sorting.desc;
      })}
      options={options}
      onChange={onChange}
      formatOptionLabel={displayOption}
      menuPlacement="bottom"
      isSearchable={false}
    />
  );
};

export default SortSelect;
