'use client';

import { autoUpdate, FloatingPortal, flip, offset, shift, size, useFloating, useMergeRefs } from '@floating-ui/react';
import { Combobox, ComboboxInput, ComboboxOption, ComboboxOptions, Button as HeadlessButton } from '@headlessui/react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { type KeyboardEvent as ReactKeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import Button from '../Button';
import Chevron from '../Chevron';
import {
  type CommonSelectProps,
  compareOptions,
  createOptionDisplay,
  getAnchoredMenuClassName,
  getMenuFloatingPlacement,
  getTriggerChevronClassName,
  getTriggerClassName,
  normaliseSearchText,
  type SelectOption,
  toOptionGroups,
  triggerFocusClassName,
} from './common';
import SelectOptionsList from './SelectOptionsList';

export interface Props<O extends SelectOption, I extends boolean = false> extends CommonSelectProps<O> {
  isMulti?: I;
  value?: (I extends true ? readonly O[] : O) | null;
  onChange?: (option: I extends true ? O[] : O) => void;
  // Keep the dropdown mounted (hidden) while closed, to avoid re-rendering large option lists on open
  keepMounted?: boolean;
  targetClassName?: string;
}

// A searchable select built on Headless UI's Combobox: a regular button trigger that opens a dropdown
// panel with an attached search box. Single-selects close on selection and render the selected option in
// the trigger; multi-selects stay open and render the trigger through `placeholder`.
//
// Architectural notes (learned the hard way):
// - We own the trigger button and open state ourselves: Headless UI's ComboboxButton is hardcoded to
//   tabIndex={-1} (it expects the input to be the tab target), which would break keyboard focus.
// - The panel is portaled and positioned with floating-ui directly (like Tooltip), anchored to our
//   trigger button. We cannot use Headless UI's `anchor` prop because it anchors floating panels to
//   the ComboboxInput, which lives *inside* this panel, so floating-ui would drift around the page.
// - `modal={false}` is required: the default modal behaviour marks the options list itself inert
//   (unclickable/unscrollable by mouse) because our search input lives inside the panel.
const SearchableSelect = <O extends SelectOption, I extends boolean = false>(props: Props<O, I>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const { refs, floatingStyles, update } = useFloating({
    placement: getMenuFloatingPlacement(props.menuPlacement, props.menuAlign),
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(8),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
      // Mirrors the --button-width variable that Headless UI sets for the anchored Listbox in Select,
      // so both menu types share getAnchoredMenuClassName
      size({
        apply({ rects, elements }) {
          elements.floating.style.setProperty('--button-width', `${rects.reference.width}px`);
        },
      }),
    ],
  });
  const triggerRef = useMergeRefs([refs.setReference, buttonRef]);

  // keepMounted panels stay mounted (hidden) while closed, so reposition explicitly on every open
  useEffect(() => {
    if (isOpen) update();
  }, [isOpen, update]);

  const displayOption = createOptionDisplay(props.formatOptionLabel);
  const optionGroups = toOptionGroups(props.options);

  const matchesQuery = (option: O) => {
    // The 'ZERϴ' replacement makes the ZERϴ chain also findable by searching for "zero"
    const searchableText = option.value.replace('ZERϴ', 'ZERO | ZERϴ');
    return normaliseSearchText(searchableText).includes(normaliseSearchText(query));
  };

  const visibleGroups = optionGroups
    .map((group) => ({ ...group, options: group.options.filter(matchesQuery) }))
    .filter((group) => group.options.length > 0);

  // Focus the search input when opening. An effect (rather than autoFocus) also covers reopening a
  // keepMounted select, and focusing the input opens the Combobox machine through `immediate`.
  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const clearQuery = useCallback(() => {
    setQuery('');
    // The input is uncontrolled (Headless UI manages it), so the DOM value is cleared separately
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  const closeMenu = useCallback(() => {
    clearQuery();
    setIsOpen(false);
  }, [clearQuery]);

  const closeMenuAndRefocusTrigger = useCallback(() => {
    closeMenu();
    setTimeout(() => buttonRef.current?.focus(), 0);
  }, [closeMenu]);

  // Close on Escape ourselves (capture phase, so it also works when focus is outside the search input),
  // returning focus to the trigger
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenuAndRefocusTrigger();
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, closeMenuAndRefocusTrigger]);

  const onChange = (newValue: O | O[] | null) => {
    if (newValue === null) return;
    props.onChange?.(newValue as I extends true ? O[] : O);

    if (props.isMulti) {
      clearQuery();
    } else {
      closeMenuAndRefocusTrigger();
    }
  };

  // In multi-select mode, Space toggles the highlighted option like a checkbox, but only while the
  // search box is empty: with a query present, Space needs to remain typeable (e.g. "Gnosis Chain")
  const toggleActiveOptionOnSpace = (event: ReactKeyboardEvent<HTMLInputElement>, activeOption: O | null) => {
    if (event.key !== ' ' || !props.isMulti || event.currentTarget.value !== '') return;
    if (!activeOption || props.isOptionDisabled?.(activeOption)) return;
    event.preventDefault();

    const currentValue = (props.value as readonly O[] | null | undefined) ?? [];
    const isSelected = currentValue.some((option) => compareOptions(option, activeOption));
    const newValue = isSelected
      ? currentValue.filter((option) => !compareOptions(option, activeOption))
      : [...currentValue, activeOption];
    onChange(newValue);
  };

  const renderTargetContent = () => {
    // Multi-selects render their selection through the placeholder (e.g. a stack of selected chain logos)
    if (props.isMulti) return props.placeholder ?? null;

    const selectedOption = props.value as O | null | undefined;
    if (!selectedOption) return props.placeholder ?? null;
    return displayOption(selectedOption, 'value');
  };

  const comboboxValue = props.isMulti
    ? ((props.value as readonly O[] | null | undefined) ?? [])
    : ((props.value as O | null | undefined) ?? null);

  return (
    <div className={twMerge('shrink-0 w-fit', props.className)}>
      <HeadlessButton
        as={Button}
        ref={triggerRef}
        style="secondary"
        size="none"
        focusRing={false}
        disabled={props.isDisabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={props['aria-label']}
        onClick={() => setIsOpen(true)}
        id={props.instanceId ? `${props.instanceId}-button` : undefined}
        className={twMerge(getTriggerClassName(props.size), triggerFocusClassName, props.targetClassName)}
      >
        {renderTargetContent()}
        <Chevron className={twMerge(getTriggerChevronClassName(props.size), 'fill-black dark:fill-white')} />
      </HeadlessButton>

      {isOpen ? (
        // Backdrop that closes the select when clicking anywhere outside the panel (incl. the trigger).
        // Closes on pointerdown (not click): Headless UI's own outside-click handling also closes on
        // pointerdown, which unmounts this backdrop before a click event would ever fire on it.
        // biome-ignore lint/a11y/noStaticElementInteractions: we know this is a hack, it is what it is
        <div
          className="fixed z-10 inset-0"
          onPointerDown={closeMenuAndRefocusTrigger}
          onKeyDown={(event) => event.key === 'Enter' && closeMenuAndRefocusTrigger()}
        />
      ) : null}

      {isOpen || props.keepMounted ? (
        <FloatingPortal>
          <Combobox
            multiple={props.isMulti as I}
            immediate
            value={comboboxValue as any}
            by={compareOptions}
            onChange={onChange}
            onClose={closeMenu}
          >
            {({ activeOption }) => (
              <ComboboxOptions
                static
                modal={false}
                ref={refs.setFloating}
                id={props.instanceId ? `${props.instanceId}-options` : undefined}
                className={twMerge(getAnchoredMenuClassName(), !isOpen && 'hidden')}
                style={{ ...floatingStyles, minWidth: props.minMenuWidth }}
              >
                <div className="flex items-center gap-2 px-2 h-9 border-b border-zinc-300 dark:border-zinc-700">
                  <ComboboxInput
                    ref={inputRef}
                    aria-label={props['aria-label']}
                    displayValue={() => ''}
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={(event) => toggleActiveOptionOnSpace(event, activeOption as O | null)}
                    className="w-full bg-transparent outline-none"
                  />
                  <MagnifyingGlassIcon className="w-5 h-5 shrink-0 text-black dark:text-white" />
                </div>

                <SelectOptionsList
                  optionComponent={ComboboxOption}
                  optionGroups={visibleGroups}
                  isMulti={props.isMulti}
                  size={props.size}
                  isOptionDisabled={props.isOptionDisabled}
                  renderOption={(option) => displayOption(option, 'menu')}
                />
              </ComboboxOptions>
            )}
          </Combobox>
        </FloatingPortal>
      ) : null}
    </div>
  );
};

export default SearchableSelect;
