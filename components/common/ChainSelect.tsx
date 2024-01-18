import useTranslation from 'next-translate/useTranslation';
import { ReactNode, useState } from 'react';
import { OptionProps } from 'react-select';
import { twMerge } from 'tailwind-merge';

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

import ChainLogo from 'components/common/ChainLogo';
import Select from 'components/common/Select';
import Button from './Button';
import Chevron from './Chevron';
import PlaceholderIcon from './PlaceholderIcon';

import { useColorTheme } from 'lib/hooks/useColorTheme';
import { useMounted } from 'lib/hooks/useMounted';
import { CHAIN_SELECT_MAINNETS, CHAIN_SELECT_TESTNETS, getChainName, isSupportedChain } from 'lib/utils/chains';

interface ChainOption {
  value: string;
  chainId: number;
}

interface Props {
  selected: number;
  chainIds?: number[];
  instanceId?: string;
  menuAlign?: 'left' | 'right';
  onSelect?: (chainId: number) => void;
  // showNames?: boolean;
}

const ChainSelect = ({ onSelect, selected, menuAlign, chainIds, instanceId }: Props) => {
  const { t } = useTranslation();
  const { darkMode } = useColorTheme();

  // Track whether the React Select is open or not
  const [isSelectOpen, setSelectOpen] = useState<boolean>(false);

  const mainnetOptions = (chainIds ?? CHAIN_SELECT_MAINNETS).map((chainId) => ({
    value: getChainName(chainId),
    chainId,
  }));

  const testnetOptions = CHAIN_SELECT_TESTNETS.map((chainId) => ({
    value: getChainName(chainId),
    chainId,
  }));

  const groups = [
    {
      label: t('common:chain_select.mainnets'),
      options: mainnetOptions,
    },
    {
      label: t('common:chain_select.testnets'),
      options: testnetOptions,
    },
  ];

  const handleSelectClose = () => setSelectOpen(false);

  const toggleSelectClose = () => setSelectOpen((prev) => !prev);

  const onChange = ({ chainId }: ChainOption) => {
    onSelect && onSelect(chainId);
    handleSelectClose();
  };

  return (
    <SelectOverlay
      isOpen={isSelectOpen}
      onClose={handleSelectClose}
      target={<TargetButton ontoggle={toggleSelectClose} chainId={selected} />}
    >
      <Select
        size="md"
        autoFocus
        onChange={onChange}
        className="shrink-0"
        menuAlign={menuAlign}
        menuPlacement="bottom"
        minMenuWidth="14.5rem"
        minControlWidth="14.5rem"
        menuIsOpen={isSelectOpen}
        aria-label="Select Network"
        classNamePrefix="chain-select"
        menuTheme={darkMode ? 'dark' : 'light'}
        instanceId={instanceId ?? 'chain-select'}
        controlTheme={darkMode ? 'dark' : 'light'}
        options={chainIds ? mainnetOptions : groups}
        placeholder={<PlaceholderIcon size={24} border />}
        isOptionDisabled={(option) => !isSupportedChain(option.chainId)}
        components={{ Option: CustomOption, DropdownIndicator: CustomDropdownIndicator }}
        value={groups.flatMap((group) => group.options).find((option) => option.chainId === selected)}
      />
    </SelectOverlay>
  );
};

export default ChainSelect;

// Component to display the selected Chain and toggle the Select
const TargetButton = ({ ontoggle, chainId }: { ontoggle: () => void; chainId: number }) => (
  <Button
    onClick={ontoggle}
    className="flex items-center pl-3 pr-2 px-2 h-9 font-normal rounded-lg focus-visible:outline-none focus-visible:ring-black focus-visible:dark:ring-white focus-visible:ring-1"
  >
    <div className="flex items-center gap-1">
      <ChainLogoMounted chainId={chainId} />
    </div>
    <Chevron className="w-5 h-5 fill-black dark:fill-white" />
  </Button>
);

// Suggestion: Is it better to place this logic in the main file, ChainLogo.tsx?
const ChainLogoMounted = ({ chainId }: { chainId: number }) => {
  const isMounted = useMounted();
  if (isMounted) return <ChainLogo chainId={chainId} />;
  else return <PlaceholderIcon size={24} border className="bg-transparent" />;
};

// Custom DropdownIndicator component for React Select to display a Search Icon
const CustomDropdownIndicator = () => {
  return <MagnifyingGlassIcon className="w-5 h-5 dark:text-white" />;
};

// Custom Option component for React Select to display Chain logo and name
const CustomOption = (props: OptionProps<ChainOption>) => {
  const { data, innerProps, isDisabled, isSelected } = props;
  return (
    <div
      className={twMerge(
        isSelected ? 'bg-zinc-800' : '',
        'flex items-center gap-1 p-2  hover:bg-zinc-800',
        isDisabled ? 'cursor-not-allowed bg-zinc-300' : 'cursor-pointer',
      )}
      {...innerProps}
    >
      <ChainLogoMounted chainId={data.chainId} />
      <div>{data.value}</div>
    </div>
  );
};

interface SelectOverlayProps {
  isOpen: boolean;
  target: ReactNode;
  children: ReactNode;
  onClose: () => void;
}

// Overlay component to wrap React select to achieve text filtering on dropdown
const SelectOverlay = ({ isOpen, target, children, onClose }: SelectOverlayProps) => {
  return (
    <div className="relative">
      {target}
      {isOpen && <div className="fixed z-10 inset-0" onClick={onClose} />}
      {isOpen && <div className="absolute z-20 mt-2 right-0">{children}</div>}
    </div>
  );
};
