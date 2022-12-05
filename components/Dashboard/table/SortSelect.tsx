import { Column, sortingFns, Table } from '@tanstack/react-table';
import { AllowanceData } from 'lib/interfaces';
import { setSelectThemeColors } from 'lib/utils/styles';
import { useMemo } from 'react';
import Select from 'react-select';
import { customSortingFns } from './columns';

interface Option {
  id: string;
  column: Column<AllowanceData>;
  desc: boolean;
}

interface Props {
  table: Table<AllowanceData>;
}

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
      className="h-full w-72"
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
      styles={{
        indicatorSeparator: () => ({
          display: 'none',
        }),
        menu: (styles) => ({
          ...styles,
          textAlign: 'left',
          border: '1px solid black',
        }),
        dropdownIndicator: (styles) => ({
          ...styles,
          paddingLeft: 0,
        }),
        valueContainer: (styles) => ({
          ...styles,
          paddingRight: 0,
        }),
        control: (styles) => ({
          ...styles,
          height: '100%',
          '&:hover': {
            backgroundColor: 'rgb(229 231 235)',
          },
          cursor: 'pointer',
        }),
        option: (styles) => ({
          ...styles,
          cursor: 'pointer',
          padding: '8px 8px',
        }),
      }}
      theme={setSelectThemeColors}
    />
  );
};

export default SortSelect;
