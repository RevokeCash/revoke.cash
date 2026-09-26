'use client';

import Checkbox from 'components/common/Checkbox';
import StatusLabel, { type Status } from 'components/common/StatusLabel';
import SearchableSelect from 'components/common/select/SearchableSelect';

export interface StatusLabelOption<T extends string> {
  value: T;
  // Shown in the pill and used to search the menu
  label: string;
  status: Status;
}

interface Props<T extends string> {
  instanceId: string;
  'aria-label': string;
  options: readonly StatusLabelOption<T>[];
  selectedValues: readonly T[];
  onChange: (values: T[]) => void;
  className?: string;
}

// Multi-select whose options show as status pills. An empty selection means "all options", so the
// trigger shows the first option and a count of the others in that case.
const StatusLabelMultiSelect = <T extends string>({
  instanceId,
  'aria-label': ariaLabel,
  options,
  selectedValues,
  onChange,
  className,
}: Props<T>) => {
  const selectedOptions = options.filter((option) => selectedValues.includes(option.value));

  const displayOption = (option: StatusLabelOption<T>, context: 'menu' | 'value') => {
    if (context !== 'menu') return option.label;

    return (
      <div className="flex items-center justify-between gap-2">
        <StatusLabel status={option.status} className="py-0.75 whitespace-nowrap">
          {option.label}
        </StatusLabel>
        <Checkbox
          checked={selectedValues.includes(option.value)}
          className="w-4 h-4 shrink-0 pointer-events-none"
          iconClassName="w-3.5 h-3.5"
        />
      </div>
    );
  };

  const displayOptions = selectedOptions.length > 0 ? selectedOptions : options;
  const [firstDisplayOption] = displayOptions;
  const controlPlaceholder = (
    <div className="flex items-center gap-1 min-w-0">
      <StatusLabel status={firstDisplayOption.status} className="py-0.75 whitespace-nowrap truncate">
        {firstDisplayOption.label}
      </StatusLabel>
      {displayOptions.length > 1 && (
        <div className="flex items-center justify-center h-5 min-w-5 px-1 shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-700 text-[11px]">
          +{displayOptions.length - 1}
        </div>
      )}
    </div>
  );

  return (
    <SearchableSelect
      instanceId={instanceId}
      aria-label={ariaLabel}
      className={className}
      targetClassName={className}
      value={selectedOptions}
      options={options}
      onChange={(newSelectedOptions) => onChange(newSelectedOptions.map((option) => option.value))}
      formatOptionLabel={displayOption}
      menuPlacement="bottom"
      minMenuWidth="14.5rem"
      placeholder={controlPlaceholder}
      keepMounted
      isMulti
    />
  );
};

export default StatusLabelMultiSelect;
