'use client';
import ChainLogo from 'components/common/ChainLogo';
import { useRouter } from 'lib/i18n/navigation';
import { CHAIN_SELECT_MAINNETS, CHAIN_SELECT_TESTNETS, getChainName, isSupportedChain } from 'lib/utils/chains';
import { useTranslations } from 'next-intl';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Button from '../Button';
import PlaceholderIcon from '../PlaceholderIcon';
import SearchableSelect from './SearchableSelect';

interface ChainOption {
  value: string;
  chainId: number;
}

interface Props {
  selected: number;
  chainIds?: number[];
  getUrl: (chainId: number) => string;
  menuAlign?: 'left' | 'right';
  instanceId?: string;
  showNames?: boolean;
}

const ChainSelectHref: React.FC<Props> = React.memo(
  ({ selected, chainIds, getUrl, instanceId, menuAlign, showNames }) => {
    const t = useTranslations();
    const router = useRouter();

    const [options, setOptions] = useState<{ mainnet: ChainOption[]; testnet: ChainOption[] }>({
      mainnet: [],
      testnet: [],
    });
    const [isLoaded, setIsLoaded] = useState(false);

    // load chain options when the component mounts or chainIds prop changes
    useEffect(() => {
      const mainnetOptions = (chainIds ?? CHAIN_SELECT_MAINNETS).map((chainId) => ({
        value: getChainName(chainId),
        chainId,
      }));
      const testnetOptions = CHAIN_SELECT_TESTNETS.map((chainId) => ({
        value: getChainName(chainId),
        chainId,
      }));
      setOptions({ mainnet: mainnetOptions, testnet: testnetOptions });
      setIsLoaded(true);
    }, [chainIds]);

    const groups = useMemo(
      () => [
        {
          label: t('common.chain_select.mainnets'),
          options: options.mainnet,
        },
        {
          label: t('common.chain_select.testnets'),
          options: options.testnet,
        },
      ],
      [options, t],
    );

    const displayOption = useCallback(
      ({ chainId }: ChainOption, { context }: any) => {
        const chainName = getChainName(chainId);
        return (
          <Button
            style="none"
            size="none"
            className="flex items-center gap-1 text-black visited:text-black dark:text-white dark:visited:text-white"
            href={context === 'menu' ? getUrl(chainId) : undefined}
            router
            align="left"
            asDiv={context !== 'menu'}
          >
            {<ChainLogo chainId={chainId} checkMounted />}
            {(context === 'menu' || showNames) && <div>{chainName}</div>}
          </Button>
        );
      },
      [getUrl, showNames],
    );

    const handleChange = useCallback(
      (option: ChainOption) => {
        router.push(getUrl(option.chainId));
      },
      [router, getUrl],
    );

    const isOptionDisabled = useCallback((option: ChainOption) => !isSupportedChain(option.chainId), []);

    if (!isLoaded) {
      return <div className="text-sm text-gray-500"> Loading...</div>;
    }

    return (
      <SearchableSelect
        instanceId={instanceId ?? 'chain-select'}
        classNamePrefix="chain-select"
        aria-label="Select Network"
        size="md"
        className="shrink-0"
        value={groups.flatMap((group) => group.options).find((option) => option.chainId === selected)}
        options={chainIds ? options.mainnet : groups}
        isOptionDisabled={isOptionDisabled}
        onChange={handleChange}
        formatOptionLabel={displayOption}
        menuPlacement="bottom"
        minMenuWidth="14.5rem"
        placeholder={<PlaceholderIcon size={24} border />} // TODO: Add full placeholder
        menuAlign={menuAlign}
        isMulti={false}
        keepMounted
      />
    );
  },
);

export default ChainSelectHref;
