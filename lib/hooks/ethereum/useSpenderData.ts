import { useQueries } from '@tanstack/react-query';
import type { Nullable, SpenderData, SpenderRiskData } from 'lib/interfaces';
import { getSpenderData } from 'lib/utils/whois';
import type { Address } from 'viem';

export interface SpenderLookup {
  chainId: number;
  spender: Address;
}

export const getSpenderKey = (chainId: number, spender: Address): string => `${chainId}-${spender}`;

export const useSpenderData = (spenders: SpenderLookup[]): Record<string, Nullable<SpenderData | SpenderRiskData>> => {
  return useQueries({
    queries: spenders.map((lookup) => ({
      queryKey: ['spenderData', lookup.chainId, lookup.spender],
      queryFn: () => getSpenderData(lookup.spender, lookup.chainId),
      staleTime: Number.POSITIVE_INFINITY,
      refetchOnWindowFocus: false,
    })),
    combine: (results) => {
      const map: Record<string, Nullable<SpenderData | SpenderRiskData>> = {};
      spenders.forEach((lookup, index) => {
        const key = getSpenderKey(lookup.chainId, lookup.spender);
        map[key] = results[index]?.data ?? null;
      });
      return map;
    },
  });
};
