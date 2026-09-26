'use client';

import { isSupportedChain } from '@revoke.cash/core/chains';
import ChainLogo from 'components/common/ChainLogo';
import ChainLogoStack from 'components/common/ChainLogoStack';
import Checkbox from 'components/common/Checkbox';
import SearchableSelect from 'components/common/select/SearchableSelect';
import { type ChainOption, useChainSelectOptions } from './useChainSelectOptions';

interface Props {
  instanceId: string;
  'aria-label': string;
  // Without a chain list, the select shows all mainnets and testnets in two groups
  chainIds?: readonly number[];
  selectedChainIds: number[];
  onChange: (chainIds: number[]) => void;
  className?: string;
}

// Multi-select over a list of chains. An empty selection means "all chains", so the trigger shows the
// logos of the full list in that case.
const ChainMultiSelect = ({
  instanceId,
  'aria-label': ariaLabel,
  chainIds,
  selectedChainIds,
  onChange,
  className,
}: Props) => {
  const { options, allOptions } = useChainSelectOptions(chainIds);

  const selectedChainIdsSet = new Set(selectedChainIds);
  const selectedOptions = allOptions.filter((option) => selectedChainIdsSet.has(option.chainId));
  const displayChainIds = selectedChainIds.length > 0 ? selectedChainIds : allOptions.map((option) => option.chainId);

  const displayOption = (option: ChainOption, context: 'menu' | 'value') => {
    if (context !== 'menu') return option.value;

    return (
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <ChainLogo chainId={option.chainId} checkMounted />
          <span className="truncate">{option.value}</span>
        </div>
        <Checkbox
          checked={selectedChainIdsSet.has(option.chainId)}
          className="w-4 h-4 shrink-0 pointer-events-none"
          iconClassName="w-3.5 h-3.5"
        />
      </div>
    );
  };

  return (
    <SearchableSelect
      instanceId={instanceId}
      aria-label={ariaLabel}
      className={className}
      targetClassName={className}
      value={selectedOptions}
      options={options}
      isOptionDisabled={(option) => !isSupportedChain(option.chainId)}
      onChange={(newSelectedOptions) => onChange(newSelectedOptions.map((option) => option.chainId))}
      formatOptionLabel={displayOption}
      menuPlacement="bottom"
      minMenuWidth="14.5rem"
      placeholder={<ChainLogoStack chainIds={displayChainIds} maxVisible={5} overlapClassName="-space-x-2" />}
      keepMounted
      isMulti
    />
  );
};

export default ChainMultiSelect;
