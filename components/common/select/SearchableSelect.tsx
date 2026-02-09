'use client';

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Select, { type Props as SelectProps } from 'components/common/select/Select';
import { useMounted } from 'lib/hooks/useMounted';
import { forwardRef, type ReactNode, type Ref, useCallback, useEffect, useRef, useState } from 'react';
import {
  type ActionMeta,
  components,
  createFilter,
  type FormatOptionLabelMeta,
  type GroupBase,
  type OnChangeValue,
  type OptionProps,
  type SelectInstance,
} from 'react-select';
import type { FilterOptionOption } from 'react-select/dist/declarations/src/filters';
import { twMerge } from 'tailwind-merge';
import Button from '../Button';
import Chevron from '../Chevron';

interface Props<O, I extends boolean, G extends GroupBase<O>> extends SelectProps<O, I, G> {
  // TODO: Support 'keepMounted' for regular Select component (currently impossible without a wrapper + controlled state)
  keepMounted?: boolean;
}

const SearchableSelect = <O, I extends boolean, G extends GroupBase<O>>(props: Props<O, I, G>) => {
  const selectRef = useRef<SelectInstance<O, I, G> | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const isMounted = useMounted();

  // Track whether the React Select is open or not
  const [isSelectOpen, setSelectOpen] = useState<boolean>(false);
  const handleSelectClose = useCallback(() => {
    buttonRef.current?.focus();
    setSelectOpen(false);
  }, []);

  const toggleSelectOpen = () => setSelectOpen((prev) => !prev);

  useEffect(() => {
    if (isSelectOpen) {
      selectRef.current?.focus();
    } else {
      selectRef.current?.blur();
    }
  }, [isSelectOpen]);

  const onChange = (option: OnChangeValue<O, I>, actionMeta: ActionMeta<O>) => {
    props?.onChange?.(option, actionMeta);
    handleSelectClose();
  };

  const filterOption = createFilter({
    stringify: (option: FilterOptionOption<O>) => option.value.replace('ZERϴ', 'ZERO | ZERϴ'),
  });

  const formatOptionLabel = (option: O, formatOptionLabelMeta: FormatOptionLabelMeta<O>) => {
    // 'value' context is handled separately in TargetButton
    if (formatOptionLabelMeta.context !== 'menu') return null;
    return props.formatOptionLabel?.(option, formatOptionLabelMeta);
  };

  return (
    <SelectOverlay
      isSelectOpen={isSelectOpen}
      handleSelectClose={handleSelectClose}
      target={<TargetButton ref={buttonRef} toggleSelectClose={toggleSelectOpen} selectProps={props as any} />}
      selectProps={props}
    >
      <Select
        {...props}
        selectRef={selectRef}
        size="md"
        autoFocus
        onChange={onChange}
        className="shrink-0"
        menuIsOpen={isMounted ? (props.keepMounted ? true : isSelectOpen) : undefined}
        filterOption={filterOption}
        minControlWidth={props.minMenuWidth}
        formatOptionLabel={props.formatOptionLabel ? formatOptionLabel : undefined}
        components={{ DropdownIndicator: CustomDropdownIndicator, Option: CustomOption, ...props.components }}
        placeholder={null}
        isSearchable
        // We're passing custom props so that the CustomOption can scroll to the selected option
        custom={{ isSelectOpen }}
      />
    </SelectOverlay>
  );
};

export default SearchableSelect;

const CustomDropdownIndicator = () => {
  return <MagnifyingGlassIcon className="w-5 h-5 text-black dark:text-white" />;
};

interface SelectOverlayProps<O, I extends boolean, G extends GroupBase<O>> {
  isSelectOpen: boolean;
  target: ReactNode;
  children: ReactNode;
  handleSelectClose: () => void;
  selectProps: Props<O, I, G>;
}

// Overlay component to wrap React select to achieve text filtering on dropdown
const SelectOverlay = <O, I extends boolean, G extends GroupBase<O>>(props: SelectOverlayProps<O, I, G>) => {
  const { isSelectOpen, target, children, handleSelectClose, selectProps } = props;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleSelectClose();
    };

    if (isSelectOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSelectOpen, handleSelectClose]);

  const className = twMerge(
    'absolute z-20 mt-2',
    selectProps.menuAlign === 'right' ? undefined : 'right-0',
    !isSelectOpen && 'hidden',
  );

  return (
    <div className={twMerge('relative shrink-0', selectProps.className)}>
      {target}
      {isSelectOpen ? (
        // biome-ignore lint/a11y/noStaticElementInteractions: we know this is a hack, it is what it is
        <div
          className="fixed z-10 inset-0"
          onClick={handleSelectClose}
          onKeyDown={(ev) => ev.key === 'Enter' && handleSelectClose()}
        />
      ) : null}
      {isSelectOpen || selectProps.keepMounted ? <div className={className}>{children}</div> : null}
    </div>
  );
};

interface TargetButtonProps<O, I extends boolean, G extends GroupBase<O>> {
  toggleSelectClose: () => void;
  selectProps: Props<O, I, G>;
}

const TargetButton = forwardRef(
  <O, I extends boolean, G extends GroupBase<O>>(props: TargetButtonProps<O, I, G>, ref: Ref<HTMLButtonElement>) => {
    const { toggleSelectClose, selectProps } = props;

    const formatControlOptionLabel = (option: O) => {
      if (!option) return selectProps.placeholder ?? null;

      if (typeof selectProps.formatOptionLabel === 'undefined') {
        return ((option as any).label as string) ?? ((option as any).value as string);
      }

      return selectProps.formatOptionLabel(option, {
        context: 'value',
        inputValue: (option as any)?.label as string,
        selectValue: [option],
      });
    };

    return (
      <Button
        ref={ref}
        size="none"
        style="secondary"
        onClick={toggleSelectClose}
        className="flex items-center gap-2 px-2 h-9 font-normal rounded-lg control-button-wrapper"
      >
        {formatControlOptionLabel(selectProps.value as O)}
        <Chevron className="w-5 h-5 fill-black dark:fill-white" />
      </Button>
    );
  },
);

const CustomOption = <O, I extends boolean, G extends GroupBase<O>>(props: OptionProps<O, I, G>) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const customProps = (props.selectProps as any).custom;

  // Scroll to the selected option when the select is opened
  // TODO: There is still an edge case, where the selected option is not *focused* when the select is opened a second time
  useEffect(() => {
    if (customProps.isSelectOpen && props.isSelected) {
      ref.current?.scrollIntoView({ behavior: 'instant', block: 'center' });
    }
  }, [props.isSelected, customProps.isSelectOpen]);

  return (
    <components.Option
      {...props}
      // This keeps existing innerRef functionality, but also allows us to scroll to the selected option
      innerRef={(el) => {
        props.innerRef?.(el);
        ref.current = el;
      }}
    />
  );
};
