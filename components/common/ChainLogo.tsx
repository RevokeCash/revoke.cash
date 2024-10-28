import ChainLogo from 'components/common/ChainLogo';
import { useColorTheme } from 'lib/hooks/useColorTheme';
import {
  CHAIN_SELECT_MAINNETS,
  CHAIN_SELECT_TESTNETS,
  getChainLogo,
  getChainName,
  isSupportedChain,
} from 'lib/utils/chains';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';
import PlaceholderIcon from './PlaceholderIcon';
import SearchableSelect from './select/SearchableSelect';

interface ChainOption {
  value: string;
  chainId: number;
  logo: string;
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
  const t = useTranslations();
  const { darkMode } = useColorTheme();
  const [cachedChains, setCachedChains] = useState<{ [key: number]: ChainOption }>({});

  // Retrieve chain data from local storage or initialize it
  useEffect(() => {
    const loadChains = () => {
      const cached = localStorage.getItem('chainData');
      if (cached) {
        setCachedChains(JSON.parse(cached));
      } else {
        const chains: { [key: number]: ChainOption } = {};

        // Spread the arrays to avoid readonly type issue
        const allChainIds = [...CHAIN_SELECT_MAINNETS, ...CHAIN_SELECT_TESTNETS];

        allChainIds.forEach((chainId) => {
          chains[chainId] = {
            value: getChainName(chainId), // Fetch chain name
            chainId,
            logo: getChainLogo(chainId), // Fetch chain logo
          };
        });

        // Cache data in local storage
        localStorage.setItem('chainData', JSON.stringify(chains));
        setCachedChains(chains);
      }
    };

    loadChains();
  }, [chainIds]);

  const mainnetOptions = useMemo(() => {
    return CHAIN_SELECT_MAINNETS.map((chainId) => cachedChains[chainId]).filter(Boolean);
  }, [cachedChains]);

  const testnetOptions = useMemo(() => {
    return CHAIN_SELECT_TESTNETS.map((chainId) => cachedChains[chainId]).filter(Boolean);
  }, [cachedChains]);

  const groups = useMemo(
    () => [
      {
        label: t('common.chain_select.mainnets'),
        options: mainnetOptions,
      },
      {
        label: t('common.chain_select.testnets'),
        options: testnetOptions,
      },
    ],
    [mainnetOptions, testnetOptions, t],
  );

  const onChange = useCallback(
    ({ chainId }: ChainOption) => {
      onSelect && onSelect(chainId);
    },
    [onSelect],
  );

  // Memoize the displayOption function to prevent unnecessary re-renders
  const displayOption = useCallback(
    ({ chainId }: ChainOption, { context }: any) => {
      const chainName = cachedChains[chainId]?.value || '';

      return (
        <div className="flex items-center gap-1">
          <ChainLogo chainId={chainId} checkMounted /> {/* Logo rendering */}
          {(context === 'menu' || showNames) && <div>{chainName}</div>} {/* Show name conditionally */}
        </div>
      );
    },
    [cachedChains, showNames], // Recreate only if cachedChains or showNames change
  );

  return (
    <SearchableSelect
      instanceId={instanceId ?? 'chain-select'}
      classNamePrefix="chain-select"
      aria-label="Select Network"
      size="md"
      className="shrink-0"
      controlTheme={darkMode ? 'dark' : 'light'}
      menuTheme={darkMode ? 'dark' : 'light'}
      value={groups.flatMap((group) => group.options).find((option) => option.chainId === selected)}
      options={groups}
      isOptionDisabled={(option) => !isSupportedChain(option.chainId)}
      onChange={onChange}
      formatOptionLabel={displayOption}
      menuPlacement="bottom"
      minMenuWidth="14.5rem"
      placeholder={<PlaceholderIcon size={24} border />}
      menuAlign={menuAlign}
    />
  );
};

export default ChainSelect;
