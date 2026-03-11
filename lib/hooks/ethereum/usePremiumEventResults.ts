import { useQueries } from '@tanstack/react-query';
import { getTokenEvents } from 'lib/chains/events';
import { isNullish } from 'lib/utils';
import { ORDERED_CHAINS } from 'lib/utils/chains';
import type { TokenEvent } from 'lib/utils/events';
import type { Address } from 'viem';
import { type CombinedQueryResult, combineQueryResults } from './combined-query-result';

export const usePremiumEventResults = (address: Address): CombinedQueryResult<TokenEvent[]>[] => {
  return useQueries({
    queries: ORDERED_CHAINS.map((chainId) => ({
      queryKey: ['events', address, chainId],
      queryFn: () => getTokenEvents(chainId, address),
      enabled: !isNullish(address),
      staleTime: Number.POSITIVE_INFINITY,
    })),
    combine: combineQueryResults,
  });
};
