import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import ChainLogo from 'components/common/ChainLogo';
import Select from 'components/common/Select';
import { useColorTheme } from 'lib/hooks/useColorTheme';
import { useMounted } from 'lib/hooks/useMounted';
import { CHAIN_SELECT_MAINNETS, CHAIN_SELECT_TESTNETS, getChainName, isSupportedChain } from 'lib/utils/chains';
import useTranslation from 'next-translate/useTranslation';
import { useState } from 'react';
import { OptionProps } from 'react-select';
import { twMerge } from 'tailwind-merge';
import Button from './Button';
import Chevron from './Chevron';
import PlaceholderIcon from './PlaceholderIcon';

interface ChainOption {
  value: string;
  chainId: number;
}

interface Props {
  selected: number;
  chainIds?: number[];
  onSelect?: (chainId: number) => void;
  menuAlign?: 'left' | 'right';
  instanceId?: string;
  showNames?: boolean;
}

const ChainSelect = ({ onSelect, selected, menuAlign, chainIds, instanceId, showNames }: Props) => {
  const isMounted = useMounted();
  const { t } = useTranslation();
  const { darkMode } = useColorTheme();

  // track react select open or not
  const [isSelectOpen, setIsSelectOpen] = useState<boolean>(false);

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

  const closeSelect = () => {
    setIsSelectOpen(false);
  };

  const onChange = ({ chainId }: ChainOption) => {
    onSelect && onSelect(chainId);
    closeSelect();
  };

  //  Custom Option component for React Select to display Chain logo and name
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
        {isMounted ? (
          <ChainLogo chainId={data.chainId} />
        ) : (
          <PlaceholderIcon size={24} border className="bg-transparent" />
        )}
        <div>{data.value}</div>
      </div>
    );
  };

  const CustomDropdownIndicator = () => {
    return <MagnifyingGlassIcon className="w-5 h-5 dark:text-white" />;
  };

  return (
    <>
      <div className="relative">
        <Button
          onClick={() => setIsSelectOpen((prev) => !prev)}
          className="flex items-center pl-3 pr-2 px-2 h-9 font-normal rounded-lg focus-visible:outline-none focus-visible:ring-black focus-visible:dark:ring-white focus-visible:ring-1"
        >
          <>
            <div className="flex items-center gap-1">
              {isMounted ? (
                <ChainLogo chainId={selected} />
              ) : (
                <PlaceholderIcon size={24} border className="bg-transparent" />
              )}
            </div>
            <Chevron className="w-5 h-5 fill-black dark:fill-white" />
          </>
        </Button>
        {isSelectOpen && <div className="fixed z-10 inset-0" onClick={closeSelect} />}
        {isSelectOpen && (
          <div className="absolute z-20 mt-2">
            <Select
              autoFocus
              menuIsOpen={isSelectOpen}
              instanceId={instanceId ?? 'chain-select'}
              classNamePrefix="chain-select"
              aria-label="Select Network"
              size="md"
              className="shrink-0"
              controlTheme={darkMode ? 'dark' : 'light'}
              menuTheme={darkMode ? 'dark' : 'light'}
              value={groups.flatMap((group) => group.options).find((option) => option.chainId === selected)}
              options={chainIds ? mainnetOptions : groups}
              isOptionDisabled={(option) => !isSupportedChain(option.chainId)}
              onChange={onChange}
              components={{ Option: CustomOption, DropdownIndicator: CustomDropdownIndicator }}
              menuPlacement="bottom"
              minMenuWidth="14.5rem"
              minControlWidth="14.5rem"
              placeholder={<PlaceholderIcon size={24} border />}
              menuAlign={menuAlign}
            />
          </div>
        )}
      </div>
    </>
  );
};

export default ChainSelect;
