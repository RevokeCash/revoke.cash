import { track } from '@amplitude/analytics-browser';
import { Column, sortingFns, Table } from '@tanstack/react-table';
import Label from 'components/common/Label';
import Select from 'components/common/Select';
import { useColorTheme } from 'lib/hooks/useColorTheme';
import { AllowanceData } from 'lib/interfaces';
import { normaliseLabel } from 'lib/utils';
import useTranslation from 'next-translate/useTranslation';
import { useMemo } from 'react';
import { ColumnId, customSortingFns } from '../columns';

interface Option {
  id: ColumnId;
  value: string;
  column: Column<AllowanceData>;
  desc: boolean;
}

interface Props {
  table: Table<AllowanceData>;
}

const SortSelect = ({ table }: Props) => {
  const { t } = useTranslation();
  const { darkMode } = useColorTheme();

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
    track('Updated Sorting', { column: id, desc });
  };

  const displayOption = ({ column, desc }: Option, { context }: any) => {
    const sortingFnDisplays = {
      [sortingFns.basic.name]: {
        asc: t('address:sorting.fns.number.asc'),
        desc: t('address:sorting.fns.number.desc'),
      },
      [sortingFns.text.name]: {
        asc: t('address:sorting.fns.text.asc'),
        desc: t('address:sorting.fns.text.desc'),
      },
      [customSortingFns.timestamp.name]: {
        asc: t('address:sorting.fns.date.asc'),
        desc: t('address:sorting.fns.date.desc'),
      },
      [customSortingFns.allowance.name]: {
        asc: t('address:sorting.fns.number.asc'),
        desc: t('address:sorting.fns.number.desc'),
      },
    };

    const sortingFnDisplay = sortingFnDisplays[column.getSortingFn().name]?.[desc ? 'desc' : 'asc'];

    const sortDisplay = `${t(`address:sorting.columns.${normaliseLabel(column.id)}`)}: ${sortingFnDisplay}`;

    if (context === 'menu') {
      return <div className="flex items-center gap-1">{sortDisplay}</div>;
    }

    return (
      <div className="flex items-center gap-2">
        {context !== 'menu' && <div>{t('address:sorting.label')}</div>}
        <Label className="flex items-center gap-1 bg-gray-300 dark:bg-gray-600 font-normal">{sortDisplay}</Label>
      </div>
    );
  };

  return (
    <Select
      instanceId="sort-select"
      className="h-full w-full md:w-72 shrink-0"
      classNamePrefix="sort-select"
      controlTheme={darkMode ? 'dark' : 'light'}
      menuTheme={darkMode ? 'dark' : 'light'}
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
