import ChainLogo from 'components/common/ChainLogo';
import { CHAIN_SELECT_MAINNETS, CHAIN_SELECT_TESTNETS } from 'lib/constants';
import { getChainName } from 'lib/utils/chains';
import { setSelectThemeColors } from 'lib/utils/styles';
import useTranslation from 'next-translate/useTranslation';
import Select from 'react-select';

interface ChainOption {
  value: string;
  chainId: number;
}

interface Props {
  onSelect: (chainId: number) => void;
  selected: number;
  showName?: boolean;
}

const ChainSelect = ({ onSelect, selected, showName }: Props) => {
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
      label: t('dashboard:mainnets'),
      options: mainnetOptions,
    },
    {
      label: t('dashboard:testnets'),
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
      className="flex-shrink-0"
      value={groups.flatMap((group) => group.options).find((option) => option.chainId === selected)}
      options={groups}
      onChange={onChange}
      formatOptionLabel={displayOption}
      menuPlacement="bottom"
      isSearchable={false}
      styles={{
        indicatorSeparator: () => ({
          display: 'none',
        }),
        menu: (styles) => ({
          ...styles,
          width: 200,
          textAlign: 'left',
          border: '1px solid black',
        }),
        dropdownIndicator: (styles) => ({
          ...styles,
          paddingLeft: 0,
        }),
        valueContainer: (styles) => ({
          ...styles,
          paddingRight: 0,
        }),
        control: (styles) => ({
          ...styles,
          height: '100%',
          '&:hover': {
            backgroundColor: 'rgb(229 231 235)',
          },
          borderRadius: 8,
          cursor: 'pointer',
        }),
        option: (styles) => ({
          ...styles,
          cursor: 'pointer',
          padding: '8px 8px',
        }),
      }}
      theme={setSelectThemeColors}
    />
  );
};

export default ChainSelect;
