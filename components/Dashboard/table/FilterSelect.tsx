import { Table } from '@tanstack/react-table';
import Label from 'components/common/Label';
import { AllowanceData } from 'lib/interfaces';
import { setSelectThemeColors } from 'lib/utils/styles';
import { useCallback } from 'react';
import Select, { components, FormatOptionLabelMeta } from 'react-select';
import { ColumnId } from './columns';

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

// TODO: Translations for filters
const FilterSelect = ({ table }: Props) => {
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

  const displayOption = useCallback((option: Option, { selectValue }: FormatOptionLabelMeta<Option>) => {
    return (
      <div className="flex items-center gap-1">
        <input
          className="cursor-pointer"
          type="checkbox"
          checked={!!selectValue.find((selected) => selected.value === option.value)}
        ></input>
        <span>{option.value}</span>
      </div>
    );
  }, []);

  const onChange = (allSelected: Option[]) => {
    const tableFilters = generateTableFilters(options, allSelected);
    table.setColumnFilters(() => tableFilters);
  };

  return (
    <Select
      instanceId="filters-select"
      className="h-full w-full"
      classNamePrefix="filters-select"
      options={options}
      onChange={onChange}
      formatOptionLabel={displayOption}
      isMulti
      closeMenuOnSelect={false}
      hideSelectedOptions={false}
      placeholder=""
      menuPlacement="bottom"
      isSearchable={false}
      components={{ ValueContainer, MultiValue: () => null, Option }}
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
        control: (styles) => ({
          ...styles,
          height: '100%',
          '&:hover': {
            backgroundColor: 'rgb(229 231 235)',
          },
          cursor: 'pointer',
          borderRadius: 8,
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

export default FilterSelect;

// We disable MultiValue and implement our own ValueContainer to display the selected options in a more compact way
const ValueContainer = ({ children, getValue, options }) => {
  const groupsWithSelected = getGroupsWithSelected(options, getValue());
  const labels = groupsWithSelected.map(
    (group) => `${group.label}: ${group.selected.map((option) => option.value).join(', ')}`
  );

  return (
    <div className="flex items-center px-2 gap-2">
      <span>Filters</span>
      {labels.map((label) => (
        <Label className="bg-gray-300 text-base rounded-md px-2 font-normal">{label}</Label>
      ))}
      {labels.length === 0 && (
        <Label className="bg-gray-300 text-base rounded-md px-2 font-normal">Showing everything</Label>
      )}
      {children}
    </div>
  );
};

// Make sure that the selected option is not highlighted
const Option = (props) => {
  return components.Option({ ...props, isSelected: false });
};
