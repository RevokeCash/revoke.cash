import { normaliseLabel } from '@revoke.cash/core/utils';
import type { ColumnSort } from '@tanstack/react-table';
import Label from 'components/common/Label';
import Select from 'components/common/select/Select';
import { useMounted } from 'lib/hooks/useMounted';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo } from 'react';
import { twMerge } from 'tailwind-merge';
import useLocalStorage from 'use-local-storage';
import { ColumnId } from '../columns';

type SortType = 'number' | 'text' | 'date';

interface Option {
  id: ColumnId;
  value: string;
  sortType: SortType;
  desc: boolean;
}

type SortableColumn = Pick<Option, 'id' | 'sortType'>;

interface Props {
  onSortChange: (sort: ColumnSort[]) => void;
  sortableColumns?: SortableColumn[];
  className?: string;
}

const DEFAULT_SORTABLE_COLUMNS: SortableColumn[] = [
  { id: ColumnId.LAST_UPDATED, sortType: 'date' },
  { id: ColumnId.VALUE_AT_RISK, sortType: 'number' },
  { id: ColumnId.SYMBOL, sortType: 'text' },
  { id: ColumnId.SPENDER, sortType: 'text' },
];

const SortSelect = ({ onSortChange, sortableColumns = DEFAULT_SORTABLE_COLUMNS, className }: Props) => {
  const t = useTranslations();
  const isMounted = useMounted();
  const [selectedSort, setSelectedSort] = useLocalStorage<ColumnSort>('allowances-table.sorting', {
    id: ColumnId.LAST_UPDATED,
    desc: true,
  });

  useEffect(() => {
    if (!selectedSort) return;
    onSortChange([selectedSort]);
  }, [selectedSort, onSortChange]);

  const options: Option[] = useMemo(() => {
    return sortableColumns.flatMap((column) => [
      { value: `${column.id}-false`, id: column.id, sortType: column.sortType, desc: false },
      { value: `${column.id}-true`, id: column.id, sortType: column.sortType, desc: true },
    ]);
  }, [sortableColumns]);

  const displayOption = ({ id, sortType, desc }: Option, context: 'menu' | 'value') => {
    const sortingFnDisplays = {
      number: {
        asc: t('address.sorting.fns.number.asc'),
        desc: t('address.sorting.fns.number.desc'),
      },
      text: {
        asc: t('address.sorting.fns.text.asc'),
        desc: t('address.sorting.fns.text.desc'),
      },
      date: {
        asc: t('address.sorting.fns.date.asc'),
        desc: t('address.sorting.fns.date.desc'),
      },
    };

    const sortingFnDisplay = sortingFnDisplays[sortType]?.[desc ? 'desc' : 'asc'];

    const sortDisplay = `${t(`address.sorting.columns.${normaliseLabel(id)}`)}: ${sortingFnDisplay}`;

    if (context === 'menu') {
      return <div className="flex items-center gap-1">{sortDisplay}</div>;
    }

    return (
      <div className="flex items-center gap-2">
        <div>{t('address.sorting.label')}</div>
        {isMounted && (
          <Label className="flex items-center gap-1 bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200">
            {sortDisplay}
          </Label>
        )}
      </div>
    );
  };

  return (
    <Select
      aria-label="Sort By"
      className={twMerge('w-full min-w-72 shrink-0', className)}
      value={options.find((option) => {
        return option.id === selectedSort.id && option.desc === selectedSort.desc;
      })}
      options={options}
      onChange={(option) => setSelectedSort({ id: option.id, desc: option.desc })}
      formatOptionLabel={displayOption}
      menuPlacement="bottom"
    />
  );
};

export default SortSelect;
