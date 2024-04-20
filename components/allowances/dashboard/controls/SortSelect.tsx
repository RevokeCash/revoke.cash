import { Column, ColumnSort, sortingFns, Table } from '@tanstack/react-table';
import Label from 'components/common/Label';
import Select from 'components/common/select/Select';
import { useColorTheme } from 'lib/hooks/useColorTheme';
import { useMounted } from 'lib/hooks/useMounted';
import { AllowanceData } from 'lib/interfaces';
import { normaliseLabel } from 'lib/utils';
import { track } from 'lib/utils/analytics';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo } from 'react';
import useLocalStorage from 'use-local-storage';
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
  const t = useTranslations();
  const isMounted = useMounted();
  const { darkMode } = useColorTheme();
  const [selectedSort, setSelectedSort] = useLocalStorage<ColumnSort>('allowances-table.sorting', {
    id: ColumnId.SYMBOL,
    desc: false,
  });

  useEffect(() => {
    if (!selectedSort) return;
    table.setSorting(() => [selectedSort]);
    track('Updated Sorting', { column: selectedSort.id, desc: selectedSort.desc });
  }, [selectedSort]);

  const options = useMemo(() => {
    return table
      .getAllColumns()
      .filter((column) => column.getCanSort())
      .flatMap((column) => [
        { value: `${column.id}-false`, id: column.id, column, desc: false },
        { value: `${column.id}-true`, id: column.id, column, desc: true },
      ]);
  }, [table]);

  const displayOption = ({ column, desc }: Option, { context }: any) => {
    const sortingFnDisplays = {
      [sortingFns.basic.name]: {
        asc: t('address.sorting.fns.number.asc'),
        desc: t('address.sorting.fns.number.desc'),
      },
      [sortingFns.text.name]: {
        asc: t('address.sorting.fns.text.asc'),
        desc: t('address.sorting.fns.text.desc'),
      },
      [customSortingFns.timestamp.name]: {
        asc: t('address.sorting.fns.date.asc'),
        desc: t('address.sorting.fns.date.desc'),
      },
      [customSortingFns.allowance.name]: {
        asc: t('address.sorting.fns.number.asc'),
        desc: t('address.sorting.fns.number.desc'),
      },
    };

    const sortingFnDisplay = sortingFnDisplays[column.getSortingFn().name]?.[desc ? 'desc' : 'asc'];

    const sortDisplay = `${t(`address.sorting.columns.${normaliseLabel(column.id)}`)}: ${sortingFnDisplay}`;

    if (context === 'menu') {
      return <div className="flex items-center gap-1">{sortDisplay}</div>;
    }

    return (
      <div className="flex items-center gap-2">
        {context !== 'menu' && <div>{t('address.sorting.label')}</div>}
        {isMounted && <Label className="flex items-center gap-1 bg-zinc-300 dark:bg-zinc-600">{sortDisplay}</Label>}
      </div>
    );
  };

  return (
    <Select
      instanceId="sort-select"
      aria-label="Sort By"
      className="w-full shrink-0"
      classNamePrefix="sort-select"
      controlTheme={darkMode ? 'dark' : 'light'}
      menuTheme={darkMode ? 'dark' : 'light'}
      value={options.find((option) => {
        const [sorting] = table.getState().sorting;
        return option.id === sorting.id && option.desc === sorting.desc;
      })}
      options={options}
      onChange={(option) => setSelectedSort({ id: option.id, desc: option.desc })}
      formatOptionLabel={displayOption}
      menuPlacement="bottom"
      isSearchable={false}
      isMulti={false}
    />
  );
};

export default SortSelect;
