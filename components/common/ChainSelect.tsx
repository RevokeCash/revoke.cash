import Select from 'components/common/Select';
import { useColorTheme } from 'lib/hooks/useColorTheme';
import { useMounted } from 'lib/hooks/useMounted';
import { CHAIN_SELECT_MAINNETS, CHAIN_SELECT_TESTNETS, getChainName, isSupportedChain } from 'lib/utils/chains';
import useTranslation from 'next-translate/useTranslation';
import ChainLogo from './ChainLogo';
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

  const onChange = ({ chainId }: ChainOption) => {
    onSelect && onSelect(chainId);
  };

  const displayOption = ({ chainId }: ChainOption, { context }: any) => {
    const chainName = getChainName(chainId);

    return (
      <div className="flex items-center gap-1 mb-1">
        {isMounted ? (
          <ChainLogo chainId={chainId} size={20} />
        ) : (
          <PlaceholderIcon size={24} border className="bg-transparent" />
        )}
        {(context === 'menu' || showNames) && <div>{chainName}</div>}
      </div>
    );
  };

  return (
    <Select
      instanceId={instanceId ?? 'chain-select'}
      classNamePrefix="chain-select"
      aria-label="Select Network"
      size="md"
      className="shrink-0 chain-select"
      controlTheme={darkMode ? 'dark' : 'light'}
      menuTheme={darkMode ? 'dark' : 'light'}
      value={groups.flatMap((group) => group.options).find((option) => option.chainId === selected)}
      options={chainIds ? mainnetOptions : groups}
      isOptionDisabled={(option) => !isSupportedChain(option.chainId)}
      onChange={onChange}
      formatOptionLabel={displayOption}
      menuPlacement="bottom"
      isSearchable={true}
      minMenuWidth="10.5rem"
      placeholder={<PlaceholderIcon size={24} border />}
      menuAlign={menuAlign}
    />
  );
};

export default ChainSelect;
