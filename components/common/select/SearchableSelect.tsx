import { ReactNode, useEffect, useState } from 'react';
import { ActionMeta, FormatOptionLabelMeta, GroupBase, OnChangeValue } from 'react-select';

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

import Select, { Props } from 'components/common/select/Select';
import Button from '../Button';
import Chevron from '../Chevron';

import { FilterOptionOption } from 'react-select/dist/declarations/src/filters';

const SearchableSelect = <O, I extends boolean, G extends GroupBase<O>>(props: Props<O, I, G>) => {
  // Track whether the React Select is open or not
  const [isSelectOpen, setSelectOpen] = useState<boolean>(false);
  const handleSelectClose = () => setSelectOpen(false);
  const toggleSelectClose = () => setSelectOpen((prev) => !prev);

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
      isOpen={isSelectOpen}
      onClose={handleSelectClose}
      target={
        <TargetButton
          toggleSelectClose={toggleSelectClose}
          option={props.value}
          formatOptionLabel={props.formatOptionLabel}
        />
      }
    >
      <Select
        {...props}
        size="md"
        autoFocus
        onChange={onChange}
        className="shrink-0"
        menuIsOpen={isSelectOpen}
        filterOption={handleFiltering}
        minControlWidth={props.minMenuWidth}
        formatOptionLabel={props.formatOptionLabel ? formatOptionLabel : undefined}
        components={{ DropdownIndicator: CustomDropdownIndicator }}
      />
    </SelectOverlay>
  );
};

export default SearchableSelect;

const CustomDropdownIndicator = () => {
  return <MagnifyingGlassIcon className="w-5 h-5 text-black dark:text-white" />;
};

interface SelectOverlayProps {
  isOpen: boolean;
  target: ReactNode;
  children: ReactNode;
  onClose: () => void;
}

// Overlay component to wrap React select to achieve text filtering on dropdown
const SelectOverlay = ({ isOpen, target, children, onClose }: SelectOverlayProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <div className="relative shrink-0">
      {target}
      {isOpen && <div className="fixed z-10 inset-0" onClick={onClose} />}
      {isOpen && <div className="absolute z-20 mt-2 right-0">{children}</div>}
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
