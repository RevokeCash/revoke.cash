'use client';

import { CHAIN_SELECT_MAINNETS, CHAIN_SELECT_TESTNETS, getChainName } from '@revoke.cash/core/chains';
import { deduplicateArray } from '@revoke.cash/core/utils';
import ChainMultiSelect from 'components/common/select/ChainMultiSelect';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

interface Props {
  chainTerms: string[];
  onChainTermsChange: (terms: string[]) => void;
}

// The chain select shows all mainnets and testnets when it gets no chain list
const SELECTABLE_CHAIN_IDS = [...CHAIN_SELECT_MAINNETS, ...CHAIN_SELECT_TESTNETS];

const normalise = (value: string) => value.trim().toLowerCase();

// A chain term is the text after "chain:" in the search box: a chain name or a chain id
const getChainIdForTerm = (chainTerm: string): number | undefined => {
  const term = normalise(chainTerm);
  return SELECTABLE_CHAIN_IDS.find((chainId) => {
    return normalise(getChainName(chainId)) === term || chainId.toString() === term;
  });
};

// Connects the chain terms of the search box to the chain multi-select, which works with chain ids
const HistoryChainMultiSelect = ({ chainTerms, onChainTermsChange }: Props) => {
  const t = useTranslations();

  const selectedChainIds = useMemo(() => {
    const chainIds = chainTerms.map(getChainIdForTerm).filter((chainId) => chainId !== undefined);
    return deduplicateArray(chainIds);
  }, [chainTerms]);

  return (
    <ChainMultiSelect
      instanceId="history-chain-multi-select"
      aria-label={t('address.headers.chain')}
      selectedChainIds={selectedChainIds}
      onChange={(chainIds) => onChainTermsChange(chainIds.map((chainId) => getChainName(chainId)))}
      className="w-full sm:w-40 shrink-0"
    />
  );
};

export default HistoryChainMultiSelect;
