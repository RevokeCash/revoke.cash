import type { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

export interface SelectOption {
  value: string;
  label?: string;
}

export interface OptionGroup<O> {
  label?: string;
  options: readonly O[];
}

export interface CommonSelectProps<O extends SelectOption> {
  options: readonly (O | OptionGroup<O>)[];
  formatOptionLabel?: (option: O, context: 'menu' | 'value') => ReactNode;
  isOptionDisabled?: (option: O) => boolean;
  isDisabled?: boolean;
  placeholder?: ReactNode;
  size?: 'sm' | 'md';
  menuPlacement?: 'top' | 'bottom';
  menuAlign?: 'left' | 'right';
  minMenuWidth?: number | string;
  className?: string;
  instanceId?: string;
  'aria-label'?: string;
}

const isOptionGroup = <O extends SelectOption>(optionOrGroup: O | OptionGroup<O>): optionOrGroup is OptionGroup<O> =>
  Array.isArray((optionOrGroup as OptionGroup<O>).options);

// Normalise flat option lists and grouped option lists into a single grouped shape
export const toOptionGroups = <O extends SelectOption>(options: readonly (O | OptionGroup<O>)[]): OptionGroup<O>[] => {
  if (options.every(isOptionGroup)) return options as OptionGroup<O>[];
  return [{ options: options as readonly O[] }];
};

export const createOptionDisplay =
  <O extends SelectOption>(formatOptionLabel: ((option: O, context: 'menu' | 'value') => ReactNode) | undefined) =>
  (option: O, context: 'menu' | 'value'): ReactNode =>
    formatOptionLabel ? formatOptionLabel(option, context) : (option.label ?? option.value);

export const compareOptions = <O extends SelectOption>(left: O | null, right: O | null): boolean => {
  if (left === null || right === null) return left === right;
  return left.value === right.value;
};

// Accent-insensitive + case-insensitive search matching
export const normaliseSearchText = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

const triggerSizeClassMapping = {
  sm: 'h-6 px-1.5',
  md: 'h-9 px-2',
} as const;

export const getTriggerClassName = (size: 'sm' | 'md' = 'md'): string =>
  twMerge('flex items-center justify-between gap-2 font-normal rounded-lg', triggerSizeClassMapping[size]);

export const getTriggerChevronClassName = (size: 'sm' | 'md' = 'md'): string =>
  size === 'sm' ? 'w-4 h-4 shrink-0' : 'w-5 h-5 shrink-0';

// Headless UI sets data-focus only for keyboard focus (unlike :focus-visible, which browsers may also
// apply when the trigger is programmatically refocused after closing the menu)
export const triggerFocusClassName = 'data-focus:border-black dark:data-focus:border-white';

export const getMenuClassName = (menuPlacement?: 'top' | 'bottom', menuAlign?: 'left' | 'right'): string =>
  twMerge(
    'absolute z-20 min-w-full w-max rounded-lg overflow-hidden text-left',
    'focus:outline-hidden',
    'bg-white dark:bg-black text-black dark:text-white',
    'border border-zinc-200 dark:border-zinc-800 shadow-[0_4px_12px_rgba(0,0,0,0.08)]',
    menuPlacement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2',
    menuAlign === 'right' ? 'left-0' : 'right-0',
  );

export const groupHeadingClassName = 'px-3 pt-3 pb-2 text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400';

interface OptionClassNameState {
  focus: boolean;
  selected: boolean;
  disabled: boolean;
  isMulti: boolean;
  size?: 'sm' | 'md';
}

// Multi-select options only show their selection state through the consumer-rendered content (e.g. a
// checkbox); single-select options get the filled background + brand accent border.
export const getOptionClassName = ({ focus, selected, disabled, isMulti, size }: OptionClassNameState): string =>
  twMerge(
    size === 'sm' ? 'px-1.5 py-1' : 'p-2',
    'cursor-pointer text-black dark:text-white',
    focus && 'bg-zinc-200 dark:bg-zinc-800',
    selected && !isMulti && 'bg-zinc-300 dark:bg-zinc-600 border-l-4 border-brand',
    disabled && 'bg-zinc-300 dark:bg-zinc-600 cursor-not-allowed',
  );
