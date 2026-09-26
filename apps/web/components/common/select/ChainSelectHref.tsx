'use client';

import { getChainName, isSupportedChain } from '@revoke.cash/core/chains';
import ChainLogo from 'components/common/ChainLogo';
import { useCsrRouter } from 'lib/i18n/csr-navigation';
import { memo } from 'react';
import Button from '../Button';
import PlaceholderIcon from '../PlaceholderIcon';
import SearchableSelect from './SearchableSelect';
import { type ChainOption, useChainSelectOptions } from './useChainSelectOptions';

interface Props {
  selected: number;
  chainIds?: number[];
  getUrl: (chainId: number) => string;
  menuAlign?: 'left' | 'right';
  instanceId?: string;
  showNames?: boolean;
}

// This component is designed to match the styling of the ChainSelect component, but with links instead
const ChainSelectHref = ({ selected, chainIds, getUrl, instanceId, menuAlign, showNames }: Props) => {
  const router = useCsrRouter();
  const { options, allOptions } = useChainSelectOptions(chainIds);

  const displayOption = ({ chainId }: ChainOption, context: 'menu' | 'value') => {
    const chainName = getChainName(chainId);

    return (
      <Button
        style="none"
        size="none"
        className="flex items-center gap-2 text-black visited:text-black dark:text-white dark:visited:text-white"
        href={context === 'menu' ? getUrl(chainId) : undefined}
        router
        align="left"
        asDiv={context !== 'menu'}
      >
        {<ChainLogo chainId={chainId} checkMounted />}
        {(context === 'menu' || showNames) && <div>{chainName}</div>}
      </Button>
    );
  };

  return (
    <SearchableSelect
      instanceId={instanceId ?? 'chain-select'}
      aria-label="Select Network"
      className="shrink-0"
      value={allOptions.find((option) => option.chainId === selected)}
      options={options}
      isOptionDisabled={(option) => !isSupportedChain(option.chainId)}
      onChange={(option) => router.push(getUrl(option.chainId))}
      formatOptionLabel={displayOption}
      menuPlacement="bottom"
      minMenuWidth="14.5rem"
      placeholder={<PlaceholderIcon size={24} border />} // TODO: Add full placeholder
      menuAlign={menuAlign}
      keepMounted
    />
  );
};

export default memo(ChainSelectHref);
