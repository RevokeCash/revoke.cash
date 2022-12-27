import ChainLogo from 'components/common/ChainLogo';
import Select from 'components/common/Select';
import { CHAIN_SELECT_MAINNETS, CHAIN_SELECT_TESTNETS } from 'lib/constants';
import { getChainName } from 'lib/utils/chains';
import useTranslation from 'next-translate/useTranslation';

interface ChainOption {
  value: string;
  chainId: number;
}

interface Props {
  onSelect: (chainId: number) => void;
  selected: number;
  showName?: boolean;
  menuAlign?: 'left' | 'right';
}

const ChainSelect = ({ onSelect, selected, showName, menuAlign }: Props) => {
  const { t } = useTranslation();

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
    onSelect(chainId);
  };

  const displayOption = ({ chainId }: ChainOption, { context }: any) => {
    const chainName = getChainName(chainId);

    return (
      <div className="flex items-center gap-1">
        <ChainLogo chainId={chainId} />
        {(context === 'menu' || showName) && <div>{chainName}</div>}
      </div>
    );
  };

  return (
    <Select
      instanceId="chain-select"
      classNamePrefix="chain-select"
      className="shrink-0"
      value={groups.flatMap((group) => group.options).find((option) => option.chainId === selected)}
      options={groups}
      onChange={onChange}
      formatOptionLabel={displayOption}
      menuPlacement="bottom"
      isSearchable={false}
      minMenuWidth={200}
      menuAlign={menuAlign}
    />
  );
};

export default ChainSelect;
