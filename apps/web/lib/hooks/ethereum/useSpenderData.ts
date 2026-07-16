import type { Nullable } from '@revoke.cash/core/types';
import { deduplicateArray } from '@revoke.cash/core/utils';
import type { SpenderData, SpenderRiskData } from '@revoke.cash/core/whois';
import { getSpenderData } from '@revoke.cash/core/whois';
import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { Address } from 'viem';

export type SpenderDataResult = Nullable<SpenderData | SpenderRiskData>;
export type SpenderDataMap = Record<string, SpenderDataResult>;

export interface SpenderLookup {
  chainId: number;
  spender: Address;
  initialData?: SpenderDataResult;
}

export const getSpenderKey = (chainId: number, spender: Address): string => `${chainId}-${spender}`;

export const useSpenderData = (spenders: SpenderLookup[]): SpenderDataMap => {
  const embeddedSpenderData = useMemo(() => getEmbeddedSpenderData(spenders), [spenders]);
  const missingSpenders = useMemo(
    () => getMissingSpenderLookups(spenders, embeddedSpenderData),
    [spenders, embeddedSpenderData],
  );

  const queriedSpenderData = useQueries({
    queries: missingSpenders.map((lookup) => ({
      queryKey: ['spenderData', lookup.chainId, lookup.spender],
      queryFn: () => getSpenderData(lookup.spender, lookup.chainId),
      staleTime: Number.POSITIVE_INFINITY,
      refetchOnWindowFocus: false,
    })),
    combine: (results) => {
      const map: SpenderDataMap = {};
      missingSpenders.forEach((lookup, index) => {
        const key = getSpenderKey(lookup.chainId, lookup.spender);
        map[key] = results[index]?.data ?? null;
      });
      return map;
    },
  });

  return useMemo(() => {
    return { ...embeddedSpenderData, ...queriedSpenderData };
  }, [embeddedSpenderData, queriedSpenderData]);
};

const getEmbeddedSpenderData = (spenders: SpenderLookup[]): SpenderDataMap => {
  return spenders.reduce<SpenderDataMap>((acc, lookup) => {
    if (lookup.initialData === undefined) return acc;

    const spenderKey = getSpenderKey(lookup.chainId, lookup.spender);
    if (acc[spenderKey] === undefined || acc[spenderKey] === null) {
      acc[spenderKey] = lookup.initialData;
    }

    return acc;
  }, {});
};

const getMissingSpenderLookups = (spenders: SpenderLookup[], embeddedSpenderData: SpenderDataMap): SpenderLookup[] => {
  const missingSpenders = spenders
    .filter((lookup) => embeddedSpenderData[getSpenderKey(lookup.chainId, lookup.spender)] === undefined)
    .map((lookup) => ({ chainId: lookup.chainId, spender: lookup.spender }));

  return deduplicateArray(missingSpenders, (lookup) => getSpenderKey(lookup.chainId, lookup.spender));
};
