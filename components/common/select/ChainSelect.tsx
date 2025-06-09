import ChainLogo from 'components/common/ChainLogo';
import { useColorTheme } from 'lib/hooks/useColorTheme';
import { CHAIN_SELECT_MAINNETS, CHAIN_SELECT_TESTNETS, getChainName, isSupportedChain } from 'lib/utils/chains';
import { useTranslations } from 'next-intl';
import { memo, useMemo, useState } from 'react';
import PlaceholderIcon from '../PlaceholderIcon';
import SearchableSelect from './SearchableSelect';

interface ChainOption {
  value: string;
  chainId: number;
  isLoadMore?: boolean;
  isTestnetLoadMore?: boolean;
}

interface Props {
  selected?: number;
  chainIds?: number[];
  onSelect?: (chainId: number) => void;
  menuAlign?: 'left' | 'right';
  instanceId?: string;
  showNames?: boolean;
}

const ChainSelect = ({ onSelect, selected, menuAlign, chainIds, instanceId, showNames }: Props) => {
  const t = useTranslations();
  const { darkMode } = useColorTheme();
  const [allChainsLoaded, setAllChainsLoaded] = useState(false);

  // Determine which chains to show based on loaded state
  const allMainnets = chainIds ?? CHAIN_SELECT_MAINNETS;
  const visibleMainnets = allChainsLoaded ? allMainnets : allMainnets.slice(0, 5);
  const visibleTestnets = allChainsLoaded ? CHAIN_SELECT_TESTNETS : CHAIN_SELECT_TESTNETS.slice(0, 3);

  const mainnetOptions = visibleMainnets.map((chainId) => ({
    value: getChainName(chainId),
    chainId,
  }));

  const testnetOptions = visibleTestnets.map((chainId) => ({
    value: getChainName(chainId),
    chainId,
  }));

  // Add "Load more" options when not all chains are loaded
  const mainnetOptionsWithLoadMore = useMemo(() => {
    if (allChainsLoaded || chainIds) return mainnetOptions;

    const remainingMainnets = allMainnets.length - visibleMainnets.length;
    if (remainingMainnets > 0) {
      return [
        ...mainnetOptions,
        {
          value: `Load more networks... (${remainingMainnets} more)`,
          chainId: -1,
          isLoadMore: true,
        },
      ];
    }
    return mainnetOptions;
  }, [mainnetOptions, allChainsLoaded, chainIds, allMainnets.length, visibleMainnets.length]);

  const testnetOptionsWithLoadMore = useMemo(() => {
    if (allChainsLoaded) return testnetOptions;

    const remainingTestnets = CHAIN_SELECT_TESTNETS.length - visibleTestnets.length;
    if (remainingTestnets > 0) {
      return [
        ...testnetOptions,
        {
          value: `Load more testnets... (${remainingTestnets} more)`,
          chainId: -2,
          isTestnetLoadMore: true,
        },
      ];
    }
    return testnetOptions;
  }, [testnetOptions, allChainsLoaded, visibleTestnets.length]);

  const groups = [
    {
      label: t('common.chain_select.mainnets'),
      options: mainnetOptionsWithLoadMore,
    },
    {
      label: t('common.chain_select.testnets'),
      options: testnetOptionsWithLoadMore,
    },
  ];

  const onChange = ({ chainId, isLoadMore, isTestnetLoadMore }: ChainOption) => {
    // Handle "Load more" clicks by expanding to show all chains
    if (isLoadMore || isTestnetLoadMore) {
      setAllChainsLoaded(true);
      return;
    }

    // Normal chain selection
    onSelect?.(chainId);
  };

  // Create optimized lookup for selected value (exclude "Load more" options)
  const selectedValue = useMemo(() => {
    if (!selected) return undefined;

    // Look in actual chain options, not "Load more" options
    const allOptions = [...mainnetOptions, ...testnetOptions];
    return allOptions.find((option) => option.chainId === selected);
  }, [selected, mainnetOptions, testnetOptions]);

  const displayOption = ({ chainId }: ChainOption, { context }: { context: 'menu' | 'value' }) => {
    // Handle "Load more" options specially
    if (chainId === -1 || chainId === -2) {
      return <div className="text-blue-600 dark:text-blue-400">Load more options...</div>;
    }

    const chainName = getChainName(chainId);
    return (
      <div className="flex items-center gap-1">
        {<ChainLogo chainId={chainId} checkMounted />}
        {(context === 'menu' || showNames) && <div>{chainName}</div>}
      </div>
    );
  };

  return (
    <SearchableSelect
      instanceId={instanceId ?? 'chain-select'}
      classNamePrefix="chain-select"
      aria-label="Select Network"
      size="md"
      className="shrink-0"
      theme={darkMode ? 'dark' : 'light'}
      value={selectedValue}
      options={chainIds ? mainnetOptionsWithLoadMore : groups}
      isOptionDisabled={(option) => !isSupportedChain(option.chainId)}
      onChange={(option) => onChange(option!)}
      formatOptionLabel={displayOption}
      menuPlacement="bottom"
      minMenuWidth="14.5rem"
      placeholder={<PlaceholderIcon size={24} border />}
      menuAlign={menuAlign}
      onInputChange={(inputValue) => {
        // Auto-load all chains when user starts searching
        if (inputValue && inputValue.length > 0 && !allChainsLoaded) {
          setAllChainsLoaded(true);
        }
      }}
      keepMounted
      isMulti={false}
    />
  );
};

export default memo(ChainSelect);
