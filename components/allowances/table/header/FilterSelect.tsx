import { Table } from '@tanstack/react-table';
import Checkbox from 'components/common/Checkbox';
import Label from 'components/common/Label';
import Select from 'components/common/Select';
import { useColorTheme } from 'lib/hooks/useColorTheme';
import { AllowanceData } from 'lib/interfaces';
import { normaliseLabel } from 'lib/utils';
import useTranslation from 'next-translate/useTranslation';
import { useCallback } from 'react';
import { FormatOptionLabelMeta } from 'react-select';
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
  const { t } = useTranslation();
  const { darkMode } = useColorTheme();

  const displayOption = useCallback((option: Option, { selectValue }: FormatOptionLabelMeta<Option>) => {
    return (
      <div className="flex items-center gap-1">
        <Checkbox checked={!!selectValue.find((selected) => selected.value === option.value)} />
        <span>{t(`address:filters.${normaliseLabel(option.group)}.options.${normaliseLabel(option.value)}`)}</span>
      </div>
    );
  }, []);

  const displayGroupLabel = useCallback((group: OptionGroup) => {
    return <span>{t(`address:filters.${normaliseLabel(group.label)}.label`)}</span>;
  }, []);

  const onChange = (allSelected: Option[]) => {
    const tableFilters = generateTableFilters(options, allSelected);
    table.setColumnFilters(() => tableFilters);
  };

  return (
    <Select
      instanceId="filters-select"
      className="w-full"
      classNamePrefix="filters-select"
      controlTheme={darkMode ? 'dark' : 'light'}
      menuTheme={darkMode ? 'dark' : 'light'}
      options={options}
      onChange={onChange}
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
  const { t } = useTranslation();

  const groupsWithSelected = getGroupsWithSelected(options, getValue());

  const labels = groupsWithSelected.map((group) => {
    const commonKey = `address:filters.${normaliseLabel(group.label)}`;
    const options = group.selected.map((option) => t(`${commonKey}.options.${normaliseLabel(option.value)}`));
    return `${t(`${commonKey}.label`)}: ${options.join(', ')}`;
  });

  return (
    <>
      <div className="flex items-center gap-2 grow">
        <span>{t('address:filters.label')}</span>
        {labels.length > 0 && (
          <div className="flex items-center gap-2 grow whitespace-nowrap overflow-scroll w-1">
            {labels.map((label) => (
              <Label key={label} className="bg-gray-300 dark:bg-gray-600 font-normal">
                {label}
              </Label>
            ))}
          </div>
        )}
        {labels.length === 0 && (
          <Label className="bg-gray-300 dark:bg-gray-600 text-sm font-normal">Showing Everything</Label>
        )}
      </div>
      {children}
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

const generateTableFilters = (groups: OptionGroup[], selected: Option[]) => {
  const groupsWithSelected = getGroupsWithSelected(groups, selected);

  const tableFilters = groupsWithSelected.map((group) => ({
    id: group.id,
    value: group.selected.map(({ value }) => value),
  }));

  return tableFilters;
};
