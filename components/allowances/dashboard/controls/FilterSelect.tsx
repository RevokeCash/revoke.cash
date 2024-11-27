import type { ColumnFiltersState, Table } from '@tanstack/react-table';
import Checkbox from 'components/common/Checkbox';
import Label from 'components/common/Label';
import Select from 'components/common/select/Select';
import { useColorTheme } from 'lib/hooks/useColorTheme';
import { useMounted } from 'lib/hooks/useMounted';
import type { AllowanceData } from 'lib/interfaces';
import { normaliseLabel } from 'lib/utils';
import { updateTableFilters } from 'lib/utils/table';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import type { FormatOptionLabelMeta } from 'react-select';
import useLocalStorage from 'use-local-storage';
import { ColumnId } from '../columns';

interface Option {
  group: string;
  value: string;
}

interface OptionGroup {
  label: string;
  id: ColumnId;
  options: Option[];
}

interface OptionGroupWithSelected extends OptionGroup {
  selected: Option[];
}

interface Props {
  table: Table<AllowanceData>;
}

const options = [
  {
    label: 'Asset Type',
    id: ColumnId.ASSET_TYPE,
    options: [
      { group: 'Asset Type', value: 'Token' },
      { group: 'Asset Type', value: 'NFT' },
    ],
  },
  {
    label: 'Asset Balance',
    id: ColumnId.BALANCE,
    options: [
      { group: 'Asset Balance', value: 'Zero' },
      { group: 'Asset Balance', value: 'Non-Zero' },
    ],
  },
  {
    label: 'Allowances',
    id: ColumnId.ALLOWANCE,
    options: [
      { group: 'Allowances', value: 'Unlimited' },
      { group: 'Allowances', value: 'Limited' },
      { group: 'Allowances', value: 'None' },
    ],
  },
];

const FilterSelect = ({ table }: Props) => {
  const t = useTranslations();
  const { darkMode } = useColorTheme();
  const [selectedFilters, setSelectedFilters] = useLocalStorage<Option[]>('allowances-table.filters', []);

  useEffect(() => {
    if (!selectedFilters) return;
    const tableFilters = generateTableFilters(options, selectedFilters);
    const ignoreIds = [ColumnId.SPENDER];
    updateTableFilters(table, tableFilters, ignoreIds);
  }, [selectedFilters]);

  const displayOption = (option: Option, { selectValue }: FormatOptionLabelMeta<Option>) => {
    return (
      <div className="flex items-center gap-1">
        <Checkbox checked={!!selectValue.find((selected) => selected.value === option.value)} />
        <span>{t(`address.filters.${normaliseLabel(option.group)}.options.${normaliseLabel(option.value)}`)}</span>
      </div>
    );
  };

  const displayGroupLabel = (group: OptionGroup) => {
    return <span>{t(`address.filters.${normaliseLabel(group.label)}.label`)}</span>;
  };

  return (
    <Select
      instanceId="filters-select"
      aria-label="Select Filters"
      className="w-full"
      classNamePrefix="filters-select"
      controlTheme={darkMode ? 'dark' : 'light'}
      menuTheme={darkMode ? 'dark' : 'light'}
      options={options}
      value={selectedFilters}
      onChange={(options) => setSelectedFilters(options as Option[])}
      formatOptionLabel={displayOption}
      formatGroupLabel={displayGroupLabel}
      isMulti
      closeMenuOnSelect={false}
      blurInputOnSelect={false}
      hideSelectedOptions={false}
      placeholder=""
      menuPlacement="bottom"
      isSearchable={false}
      components={{ ValueContainer, MultiValue: () => null }}
    />
  );
};

export default FilterSelect;

// We disable MultiValue and implement our own ValueContainer to display the selected options in a more compact way
const ValueContainer = ({ children, getValue, options }) => {
  const t = useTranslations();
  const isMounted = useMounted();

  const groupsWithSelected = getGroupsWithSelected(options, getValue());

  const labels = groupsWithSelected.map((group) => {
    const commonKey = `address.filters.${normaliseLabel(group.label)}`;
    const options = group.selected.map((option) => t(`${commonKey}.options.${normaliseLabel(option.value)}`));
    return `${t(`${commonKey}.label`)}: ${options.join(', ')}`;
  });

  return (
    <>
      <div className="flex items-center gap-2 grow">
        <span>{t('address.filters.label')}</span>
        {isMounted && labels.length > 0 && (
          <div className="flex items-center gap-2 grow whitespace-nowrap overflow-scroll w-1 scrollbar-hide">
            {labels.map((label) => (
              <Label key={label} className="bg-zinc-300 dark:bg-zinc-600">
                {label}
              </Label>
            ))}
          </div>
        )}
        {isMounted && labels.length === 0 && (
          <Label className="bg-zinc-300 dark:bg-zinc-600">{t('address.filters.showing_everything')}</Label>
        )}
      </div>
      {isMounted && children}
    </>
  );
};

const getGroupsWithSelected = (groups: OptionGroup[], selected: Option[]): OptionGroupWithSelected[] => {
  const groupsWithSelected = groups.map((group) => {
    const groupSelected = selected.filter((option) => option.group === group.label);
    // If all are selected, then none are selected
    const groupSelectedRefined = groupSelected.length === group.options.length ? [] : groupSelected;
    return { ...group, selected: groupSelectedRefined };
  });

  return groupsWithSelected.filter((group) => group.selected.length > 0);
};

const generateTableFilters = (groups: OptionGroup[], selected: Option[]): ColumnFiltersState => {
  const groupsWithSelected = getGroupsWithSelected(groups, selected);

  const tableFilters = groupsWithSelected.map((group) => ({
    id: group.id,
    value: group.selected.map(({ value }) => value),
  }));

  return tableFilters;
};
