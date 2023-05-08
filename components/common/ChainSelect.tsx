import ChainLogo from 'components/common/ChainLogo';
import Select from 'components/common/Select';
import { useColorTheme } from 'lib/hooks/useColorTheme';
import { useMounted } from 'lib/hooks/useMounted';
import { CHAIN_SELECT_MAINNETS, CHAIN_SELECT_TESTNETS, getChainName } from 'lib/utils/chains';
import useTranslation from 'next-translate/useTranslation';
import PlaceholderIcon from './PlaceholderIcon';

interface ChainOption {
  value: string;
  chainId: number;
}

interface Props {
  selected: number;
  onSelect?: (chainId: number) => void;
  showName?: boolean;
  menuAlign?: 'left' | 'right';
}

const ChainSelect = ({ onSelect, selected, showName, menuAlign }: Props) => {
  const isMounted = useMounted();
  const { t } = useTranslation();
  const { darkMode } = useColorTheme();

  const mainnetOptions = CHAIN_SELECT_MAINNETS.map((chainId) => ({
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

  const onChange = ({ chainId }: ChainOption) => {
    onSelect && onSelect(chainId);
  };

  const displayOption = ({ chainId }: ChainOption, { context }: any) => {
    const chainName = getChainName(chainId);

    return (
      <div className="flex items-center gap-1">
        {isMounted ? <ChainLogo chainId={chainId} /> : <PlaceholderIcon size={24} border className="bg-transparent" />}
        {(context === 'menu' || showName) && <div>{chainName}</div>}
      </div>
    );
  };

  return (
    <Select
      instanceId="chain-select"
      classNamePrefix="chain-select"
      className="shrink-0"
      controlTheme={darkMode ? 'dark' : 'light'}
      menuTheme={darkMode ? 'dark' : 'light'}
      value={groups.flatMap((group) => group.options).find((option) => option.chainId === selected)}
      options={groups}
      onChange={onChange}
      formatOptionLabel={displayOption}
      menuPlacement="bottom"
      isSearchable={false}
      minMenuWidth="13.5rem"
      placeholder={<PlaceholderIcon size={24} border />}
      menuAlign={menuAlign}
    />
  );
};

export default ChainSelect;
