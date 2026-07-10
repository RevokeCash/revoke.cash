'use client';

import { useTranslations } from 'next-intl';
import type { ElementType, ReactNode } from 'react';
import { getOptionClassName, groupHeadingClassName, type OptionGroup, type SelectOption } from './common';

interface Props<O extends SelectOption> {
  // Headless UI's ListboxOption (used by Select) and ComboboxOption (used by SearchableSelect) accept the
  // same props for our purposes: value, disabled, and a className render prop with focus/selected/disabled
  optionComponent: ElementType;
  optionGroups: OptionGroup<O>[];
  isMulti?: boolean;
  size?: 'sm' | 'md';
  isOptionDisabled?: (option: O) => boolean;
  renderOption: (option: O) => ReactNode;
}

// The scrollable (grouped) option list shared by Select and SearchableSelect, so their dropdown rendering
// and option styling cannot drift apart
const SelectOptionsList = <O extends SelectOption>(props: Props<O>) => {
  const t = useTranslations();
  const { optionComponent: OptionComponent } = props;

  const isEmpty = props.optionGroups.every((group) => group.options.length === 0);

  return (
    <div className="max-h-88 overflow-y-auto">
      {props.optionGroups.map((group, groupIndex) => (
        <div key={group.label ?? groupIndex}>
          {group.label ? <div className={groupHeadingClassName}>{group.label}</div> : null}
          {group.options.map((option) => (
            <OptionComponent
              key={option.value}
              value={option}
              disabled={props.isOptionDisabled?.(option) ?? false}
              className={(state: { focus: boolean; selected: boolean; disabled: boolean }) =>
                getOptionClassName({ ...state, isMulti: props.isMulti ?? false, size: props.size })
              }
            >
              {props.renderOption(option)}
            </OptionComponent>
          ))}
        </div>
      ))}
      {isEmpty ? <div className="p-2 text-zinc-500 dark:text-zinc-400">{t('common.select.no_options')}</div> : null}
    </div>
  );
};

export default SelectOptionsList;
