import { ReactNode, useEffect, useRef, useState } from 'react';
import { ActionMeta, FormatOptionLabelMeta, GroupBase, OnChangeValue, SelectInstance } from 'react-select';

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

import Select, { Props as SelectProps } from 'components/common/select/Select';
import Button from '../Button';
import Chevron from '../Chevron';

import { FilterOptionOption } from 'react-select/dist/declarations/src/filters';
import { twMerge } from 'tailwind-merge';

interface Props<O, I extends boolean, G extends GroupBase<O>> extends SelectProps<O, I, G> {
  // TODO: Support 'keepMounted' for regular Select component (currently impossible without a wrapper + controlled state)
  keepMounted?: boolean;
}

const SearchableSelect = <O, I extends boolean, G extends GroupBase<O>>(props: Props<O, I, G>) => {
  const selectRef = useRef<SelectInstance<O, I, G> | null>(null);

  // Track whether the React Select is open or not
  const [isSelectOpen, setSelectOpen] = useState<boolean>(false);
  const handleSelectClose = () => setSelectOpen(false);
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

  const handleFiltering = (option: FilterOptionOption<O>, inputValue: string) => {
    const lowerCaseValue = inputValue.toLowerCase();
    return option.value.toLowerCase().includes(lowerCaseValue);
  };

  const formatOptionLabel = (option: O, formatOptionLabelMeta: FormatOptionLabelMeta<O>) => {
    // 'value' context is handled separately in TargetButton
    if (formatOptionLabelMeta.context === 'value') return null;
    return props.formatOptionLabel(option, formatOptionLabelMeta);
  };

  return (
    <SelectOverlay
      isSelectOpen={isSelectOpen}
      handleSelectClose={handleSelectClose}
      target={
        <TargetButton
          toggleSelectClose={toggleSelectOpen}
          option={props.value}
          formatOptionLabel={props.formatOptionLabel}
        />
      }
      selectProps={props}
    >
      <Select
        {...props}
        selectRef={selectRef}
        size="md"
        autoFocus
        onChange={onChange}
        className="shrink-0"
        menuIsOpen={props.keepMounted ? true : isSelectOpen}
        filterOption={handleFiltering}
        minControlWidth={props.minMenuWidth}
        formatOptionLabel={props.formatOptionLabel ? formatOptionLabel : undefined}
        components={{ DropdownIndicator: CustomDropdownIndicator, ...props.components }}
        isSearchable
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
  }, [isSelectOpen]);

  return (
    <div className={twMerge('relative shrink-0', selectProps.className)}>
      {target}
      {isSelectOpen && <div className="fixed z-10 inset-0" onClick={handleSelectClose} />}
      {isSelectOpen || selectProps.keepMounted ? (
        <div className={twMerge('absolute z-20 mt-2 right-0', !isSelectOpen && 'hidden')}>{children}</div>
      ) : null}
    </div>
  );
};

interface TargetButtonProps<O> {
  toggleSelectClose: () => void;
  option: O;
  formatOptionLabel: (option: O, formatOptionLabelMeta: FormatOptionLabelMeta<O>) => ReactNode;
}

const TargetButton = <O,>({ toggleSelectClose, option, formatOptionLabel }: TargetButtonProps<O>) => {
  const formatControlOptionLabel = (option: O) => {
    if (typeof formatOptionLabel === 'undefined') {
      return ((option as any).label as string) ?? ((option as any).value as string);
    }

    return formatOptionLabel(option, {
      context: 'value',
      inputValue: (option as any).label as string,
      selectValue: [option],
    });
  };

  return (
    <Button
      size="none"
      style="secondary"
      onClick={toggleSelectClose}
      className="flex items-center px-2 h-9 font-normal rounded-lg"
    >
      {formatControlOptionLabel(option)}
      <Chevron className="w-5 h-5 fill-black dark:fill-white" />
    </Button>
  );
};
