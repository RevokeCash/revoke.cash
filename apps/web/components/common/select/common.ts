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

// Text sizes are set explicitly (rather than inherited) because the menu is rendered in a portal,
// so it does not inherit the text size of the trigger's surroundings
const triggerSizeClassMapping = {
  sm: 'h-6 pl-2 pr-1.5 text-sm',
  md: 'h-9 px-2',
} as const;

export const getTriggerClassName = (size: 'sm' | 'md' = 'md'): string =>
  twMerge('flex items-center justify-between gap-2 font-normal rounded-lg', triggerSizeClassMapping[size]);

export const getTriggerChevronClassName = (size: 'sm' | 'md' = 'md'): string =>
  size === 'sm' ? 'w-4 h-4 shrink-0' : 'w-5 h-5 shrink-0';

// Headless UI sets data-focus only for keyboard focus (unlike :focus-visible, which browsers may also
// apply when the trigger is programmatically refocused after closing the menu)
export const triggerFocusClassName = 'data-focus:border-black dark:data-focus:border-white';

// Anchored menus are rendered in a portal, so they cannot be clipped by ancestors with overflow
// styles (such as CollapsibleCard) and automatically flip when out of viewport space. The
// --button-width variable is set by Headless UI for anchored Listbox menus and by SearchableSelect's
// floating-ui size middleware, so both menu types can match their trigger's width.
export const getAnchoredMenuClassName = (): string =>
  twMerge(
    'z-20 w-max min-w-(--button-width) rounded-lg overflow-hidden text-left',
    'focus:outline-hidden',
    'bg-white dark:bg-black text-black dark:text-white',
    'border border-zinc-200 dark:border-zinc-800 shadow-lg',
  );

const getMenuPlacementParts = (menuPlacement?: 'top' | 'bottom', menuAlign?: 'left' | 'right') =>
  ({ side: menuPlacement ?? 'bottom', align: menuAlign === 'right' ? 'start' : 'end' }) as const;

// Headless UI anchor format ('bottom end'), used by the Listbox-based Select
export const getMenuAnchor = (menuPlacement?: 'top' | 'bottom', menuAlign?: 'left' | 'right') => {
  const { side, align } = getMenuPlacementParts(menuPlacement, menuAlign);
  return { to: `${side} ${align}` as const, gap: 8 };
};

// floating-ui placement format ('bottom-end'), used by the Combobox-based SearchableSelect
export const getMenuFloatingPlacement = (menuPlacement?: 'top' | 'bottom', menuAlign?: 'left' | 'right') => {
  const { side, align } = getMenuPlacementParts(menuPlacement, menuAlign);
  return `${side}-${align}` as const;
};

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
    size === 'sm' ? 'px-2 py-1 text-sm' : 'p-2',
    'cursor-pointer text-black dark:text-white',
    focus && 'bg-zinc-200 dark:bg-zinc-800',
    selected && !isMulti && 'bg-zinc-300 dark:bg-zinc-600 border-l-4 border-brand',
    disabled && 'bg-zinc-300 dark:bg-zinc-600 cursor-not-allowed',
  );
