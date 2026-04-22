'use client';

import { CHAIN_SELECT_MAINNETS, CHAIN_SELECT_TESTNETS, getChainName } from '@revoke.cash/core/chains';
import ChainLogo from 'components/common/ChainLogo';
import ChainLogoStack from 'components/common/ChainLogoStack';
import Checkbox from 'components/common/Checkbox';
import SearchableSelect from 'components/common/select/SearchableSelect';
import { useColorTheme } from 'lib/hooks/useColorTheme';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import type { FormatOptionLabelMeta } from 'react-select';

interface ChainOption {
  value: string;
  chainId: number;
}

interface Props {
  chainTerms: string[];
  onChainTermsChange: (terms: string[]) => void;
}

const normalise = (value: string) => value.trim().toLowerCase();

const HistoryChainMultiSelect = ({ chainTerms, onChainTermsChange }: Props) => {
  const t = useTranslations();
  const { darkMode } = useColorTheme();

  const mainnetOptions = useMemo<ChainOption[]>(
    () =>
      CHAIN_SELECT_MAINNETS.map((chainId) => ({
        value: getChainName(chainId),
        chainId,
      })),
    [],
  );

  const testnetOptions = useMemo<ChainOption[]>(
    () =>
      CHAIN_SELECT_TESTNETS.map((chainId) => ({
        value: getChainName(chainId),
        chainId,
      })),
    [],
  );

  const groupedOptions = useMemo(
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

  const allOptions = useMemo(() => [...mainnetOptions, ...testnetOptions], [mainnetOptions, testnetOptions]);
  const allChainIds = useMemo(() => allOptions.map((option) => option.chainId), [allOptions]);

  const selectedOptions = useMemo(() => {
    return chainTerms.reduce<ChainOption[]>((selected, chainTerm) => {
      const term = normalise(chainTerm);
      const option = allOptions.find((candidate) => {
        return normalise(candidate.value) === term || candidate.chainId.toString() === term;
      });
      if (!option) return selected;
      if (selected.some((candidate) => candidate.chainId === option.chainId)) return selected;
      selected.push(option);
      return selected;
    }, []);
  }, [allOptions, chainTerms]);

  const selectedChainIds = selectedOptions.map((selectedOption) => selectedOption.chainId);
  const selectedChainIdsSet = new Set(selectedChainIds);
  const displayChainIds = selectedChainIds.length > 0 ? selectedChainIds : allChainIds;
  const selectValue = selectedOptions;

  const displayOption = (option: ChainOption, { context }: FormatOptionLabelMeta<ChainOption>) => {
    if (context !== 'menu') return option.value;

    const isOptionSelected = selectedChainIdsSet.has(option.chainId);

    return (
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <ChainLogo chainId={option.chainId} checkMounted />
          <span className="truncate">{option.value}</span>
        </div>
        <Checkbox
          checked={isOptionSelected}
          className="w-4 h-4 shrink-0 pointer-events-none"
          iconClassName="w-3.5 h-3.5"
        />
      </div>
    );
  };

  const controlPlaceholder = (
    <div className="flex items-center min-w-0">
      <ChainLogoStack
        chainIds={displayChainIds}
        maxVisible={5}
        logoSize={20}
        overlapClassName="-space-x-2"
        itemClassName="ring-1"
        overflowClassName="h-5 min-w-5 text-[11px] bg-zinc-200 dark:bg-zinc-700 ring-1"
      />
    </div>
  );

  return (
    <SearchableSelect
      instanceId="history-chain-multi-select"
      classNamePrefix="history-chain-multi-select"
      aria-label={t('address.headers.chain')}
      className="w-full sm:w-40 shrink-0"
      targetClassName="w-full sm:w-40 shrink-0"
      theme={darkMode ? 'dark' : 'light'}
      value={selectValue}
      options={groupedOptions}
      onChange={(options) => {
        onChainTermsChange((options ?? []).map((option) => option.value));
      }}
      formatOptionLabel={displayOption}
      menuPlacement="bottom"
      minMenuWidth="14.5rem"
      placeholder={controlPlaceholder}
      controlShouldRenderValue={false}
      closeMenuOnSelect={false}
      hideSelectedOptions={false}
      keepMounted
      isMulti
      isSearchable
    />
  );
};

export default HistoryChainMultiSelect;
