import { ReactNode, Ref, forwardRef, useEffect, useRef, useState } from 'react';
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
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  // Track whether the React Select is open or not
  const [isSelectOpen, setSelectOpen] = useState<boolean>(false);
  const handleSelectClose = () => {
    buttonRef.current?.focus();
    setSelectOpen(false);
  };
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
    if (formatOptionLabelMeta.context !== 'menu') return null;
    return props.formatOptionLabel(option, formatOptionLabelMeta);
  };

  return (
    <SelectOverlay
      isSelectOpen={isSelectOpen}
      handleSelectClose={handleSelectClose}
      target={<TargetButton ref={buttonRef} toggleSelectClose={toggleSelectOpen} selectProps={props} />}
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
        placeholder={null}
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

  const className = twMerge(
    'absolute z-20 mt-2',
    selectProps.menuAlign === 'right' ? undefined : 'right-0',
    !isSelectOpen && 'hidden',
  );

  return (
    <div className={twMerge('relative shrink-0', selectProps.className)}>
      {target}
      {isSelectOpen && <div className="fixed z-10 inset-0" onClick={handleSelectClose} />}
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
        className="flex items-center px-2 h-9 font-normal rounded-lg control-button-wrapper"
      >
        {formatControlOptionLabel(selectProps.value as O)}
        <Chevron className="w-5 h-5 fill-black dark:fill-white" />
      </Button>
    );
  },
);
