'use client';

import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { twMerge } from 'tailwind-merge';
import Button from '../Button';
import Chevron from '../Chevron';
import {
  type CommonSelectProps,
  compareOptions,
  createOptionDisplay,
  getAnchoredMenuClassName,
  getMenuAnchor,
  getTriggerChevronClassName,
  getTriggerClassName,
  type SelectOption,
  toOptionGroups,
  triggerFocusClassName,
} from './common';
import SelectOptionsList from './SelectOptionsList';

export interface Props<O extends SelectOption> extends CommonSelectProps<O> {
  value?: O | null;
  onChange?: (option: O) => void;
}

// A single-value (non-searchable) select built on Headless UI's Listbox
const Select = <O extends SelectOption>(props: Props<O>) => {
  const displayOption = createOptionDisplay(props.formatOptionLabel);
  const optionGroups = toOptionGroups(props.options);
  const selectedOption = props.value ?? null;

  const onChange = (option: O | null) => {
    if (option === null) return;
    props.onChange?.(option);
  };

  return (
    <Listbox value={selectedOption} onChange={onChange} by={compareOptions} disabled={props.isDisabled}>
      <div className={twMerge('relative', props.className)}>
        <ListboxButton
          as={Button}
          style="secondary"
          size="none"
          focusRing={false}
          id={props.instanceId ? `${props.instanceId}-button` : undefined}
          aria-label={props['aria-label']}
          className={twMerge(getTriggerClassName(props.size), 'w-full', triggerFocusClassName)}
        >
          {selectedOption ? (
            displayOption(selectedOption, 'value')
          ) : (
            <span className="text-zinc-500 dark:text-zinc-400">{props.placeholder ?? null}</span>
          )}
          <Chevron className={twMerge(getTriggerChevronClassName(props.size), 'fill-zinc-600 dark:fill-zinc-400')} />
        </ListboxButton>

        <ListboxOptions
          modal={false}
          anchor={getMenuAnchor(props.menuPlacement, props.menuAlign)}
          id={props.instanceId ? `${props.instanceId}-options` : undefined}
          className={getAnchoredMenuClassName()}
          style={{ minWidth: props.minMenuWidth }}
        >
          <SelectOptionsList
            optionComponent={ListboxOption}
            optionGroups={optionGroups}
            size={props.size}
            isOptionDisabled={props.isOptionDisabled}
            renderOption={(option) => displayOption(option, 'menu')}
          />
        </ListboxOptions>
      </div>
    </Listbox>
  );
};

export default Select;
