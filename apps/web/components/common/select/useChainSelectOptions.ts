'use client';

import { CHAIN_SELECT_MAINNETS, CHAIN_SELECT_TESTNETS, getChainName } from '@revoke.cash/core/chains';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import type { OptionGroup } from './common';

export interface ChainOption {
  value: string;
  chainId: number;
}

interface ChainSelectOptions {
  // The options as the select shows them: a flat list, or groups with a heading
  options: readonly (ChainOption | OptionGroup<ChainOption>)[];
  // All options in one flat list, to find the selected options
  allOptions: readonly ChainOption[];
}

const toChainOption = (chainId: number): ChainOption => ({ value: getChainName(chainId), chainId });

// Options for the chain selects. Without a chain list, the options are all mainnets and testnets in two
// groups. With a chain list, the options are only those chains, without groups.
export const useChainSelectOptions = (chainIds?: readonly number[]): ChainSelectOptions => {
  const t = useTranslations();

  return useMemo(() => {
    if (chainIds) {
      const chainOptions = chainIds.map(toChainOption);
      return { options: chainOptions, allOptions: chainOptions };
    }

    const mainnetOptions = CHAIN_SELECT_MAINNETS.map(toChainOption);
    const testnetOptions = CHAIN_SELECT_TESTNETS.map(toChainOption);

    return {
      options: [
        { label: t('common.chain_select.mainnets'), options: mainnetOptions },
        { label: t('common.chain_select.testnets'), options: testnetOptions },
      ],
      allOptions: [...mainnetOptions, ...testnetOptions],
    };
  }, [chainIds, t]);
};
