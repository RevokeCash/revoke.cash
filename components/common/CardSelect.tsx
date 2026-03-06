'use client';

import { Radio, RadioGroup } from '@headlessui/react';
import { twMerge } from 'tailwind-merge';
import Label from './Label';

export interface CardSelectOption<T extends string> {
  value: T;
  label: string;
  description?: string;
  tag?: string;
}

interface Props<T extends string> {
  options: CardSelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}

const CardSelect = <T extends string>({ options, value, onChange, disabled }: Props<T>) => {
  return (
    <RadioGroup value={value} onChange={onChange} disabled={disabled} className="flex gap-3">
      {options.map((option) => (
        <Radio
          key={option.value}
          value={option.value}
          className={twMerge(
            'group flex flex-1 flex-col items-center justify-center rounded-lg px-4 py-3 text-sm font-semibold cursor-pointer transition',
            'ring-1 ring-zinc-300 dark:ring-zinc-600',
            'focus:outline-hidden data-focus:ring-2 data-focus:ring-black dark:data-focus:ring-white',
            'hover:bg-zinc-50 dark:hover:bg-zinc-900',
            'data-checked:text-zinc-900 data-checked:bg-brand dark:data-checked:bg-brand data-checked:ring-0',
            'data-disabled:opacity-50 data-disabled:cursor-not-allowed',
          )}
        >
          <span>{option.label}</span>
          {option.description && (
            <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400 group-data-checked:text-zinc-700">
              {option.description}
            </span>
          )}
          {option.tag && (
            <Label
              className={twMerge(
                'mt-1 bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300',
                'group-data-checked:bg-zinc-900/15 group-data-checked:text-zinc-900',
              )}
            >
              {option.tag}
            </Label>
          )}
        </Radio>
      ))}
    </RadioGroup>
  );
};

export default CardSelect;
