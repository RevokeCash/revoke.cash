import { LABEL_CDN_TTL_SECONDS } from '@revoke.cash/core/constants';
import type { Nullable } from '@revoke.cash/core/types';
import { deduplicateArray } from '@revoke.cash/core/utils';
import type { SpenderData } from '@revoke.cash/core/whois';
import { getSpenderData } from '@revoke.cash/core/whois';
import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { Address } from 'viem';

export type SpenderDataMap = Record<string, Nullable<SpenderData>>;

export interface SpenderLookup {
  chainId: number;
  spender: Address;
  initialData?: Nullable<SpenderData>;
}

export const getSpenderKey = (chainId: number, spender: Address): string => `${chainId}-${spender}`;

// The one spender data query, so every caller shares its cache entry and stale time
export const getSpenderDataQuery = (chainId: number, spender: Address) => ({
  queryKey: ['spenderData', chainId, spender],
  queryFn: () => getSpenderData(spender, chainId),
  staleTime: LABEL_CDN_TTL_SECONDS * 1000,
});

export const useSpenderData = (spenders: SpenderLookup[]): SpenderDataMap => {
  const embeddedSpenderData = useMemo(() => getEmbeddedSpenderData(spenders), [spenders]);
  const missingSpenders = useMemo(
    () => getMissingSpenderLookups(spenders, embeddedSpenderData),
    [spenders, embeddedSpenderData],
  );

  const queriedSpenderData = useQueries({
    queries: missingSpenders.map((lookup) => ({
      ...getSpenderDataQuery(lookup.chainId, lookup.spender),
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
